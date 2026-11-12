import { getKantor, HARI_SLOT_KEMBALI } from "./kantor";
import { hitungKuota, listPeserta } from "./kuota";
import { hapusKadaluarsa, listPendaftar, statusOf } from "./pendaftar";
import { getConfig } from "./notifikasi-config";
import { emailSiap, kirimEmail } from "./email";
import { hariIni, selisihHari } from "./tanggal";
import { redis } from "./store";

export const MILESTONE = [21, 14, 7, 3];
// Titik pengiriman "peserta akan berakhir": milestone + hari terakhir (0 = berakhir hari ini)
const TITIK_KELUAR = [...MILESTONE, 0];

const JAM_MULAI = 7;
const JAM_SELESAI = 17;
const BATAS_HARI_BARU = 7; // pendaftar baru lebih tua dari ini tidak diemail
const HARI_MULAI = 7; // pengingat H-7 sebelum tanggal mulai

type Ev =
  | { t: "baru"; nama: string; mulai?: string; selesai?: string }
  | { t: "mulai"; nama: string; mulai: string; sisa: number }
  | { t: "keluar"; nama: string; selesai: string; sisa: number }
  | { t: "kuota"; buka: number; sisa: number; max: number };

export type Riwayat = { waktu: string; subjek: string; ke: string[]; ok: boolean; error?: string };
type Log = { terkirim: Record<string, string>; kuota: Record<string, number>; riwayat: Riwayat[] };

const LOG_KEY = "notifikasi-log";
const BELUM_SIAP = "Email belum diatur: isi APPS_SCRIPT_URL dan APPS_SCRIPT_SECRET di Environment Variables.";

function jamWIB() {
  return (
    Number(
      new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", hour12: false }).format(new Date())
    ) % 24
  );
}

export function jamKerja() {
  const j = jamWIB();
  return j >= JAM_MULAI && j < JAM_SELESAI;
}

const tanggalWIB = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date(iso));

async function bacaLog(): Promise<Log> {
  const l = await redis.get<Partial<Log>>(LOG_KEY);
  return { terkirim: l?.terkirim ?? {}, kuota: l?.kuota ?? {}, riwayat: l?.riwayat ?? [] };
}

async function tulisLog(l: Log) {
  await redis.set(LOG_KEY, { ...l, riwayat: l.riwayat.slice(0, 100) });
}

const lewatRetensi = (waktu: string, hari: number) => Date.now() - new Date(waktu).getTime() > hari * 86_400_000;

// Riwayat yang ditampilkan: otomatis menyembunyikan yang lebih tua dari batas hari
export async function getRiwayat() {
  const [log, cfg] = await Promise.all([bacaLog(), getConfig()]);
  return log.riwayat.filter((r) => !lewatRetensi(r.waktu, cfg.hapusHari));
}

export async function getTerkirim() {
  return (await bacaLog()).terkirim;
}

const tgl = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("id-ID", { dateStyle: "medium", timeZone: "UTC" });

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function baris(e: Ev) {
  if (e.t === "baru") {
    const periode = e.mulai && e.selesai ? ` untuk periode ${tgl(e.mulai)} - ${tgl(e.selesai)}` : "";
    return `${e.nama} baru mendaftar magang${periode}`;
  }
  if (e.t === "mulai") {
    const kapan = e.sisa <= 0 ? "hari ini" : `${e.sisa} hari lagi`;
    return `${e.nama} akan mulai magang ${tgl(e.mulai)} (${kapan}) — belum diputuskan, mohon diterima atau ditolak`;
  }
  if (e.t === "keluar") {
    const kapan = e.sisa <= 0 ? "hari ini" : `${e.sisa} hari lagi`;
    const slot = e.sisa <= HARI_SLOT_KEMBALI ? " — slot kuota sudah dihitung kosong" : "";
    return `${e.nama} berakhir magang ${tgl(e.selesai)} (${kapan})${slot}`;
  }
  return `Kuota terbuka: ${e.buka} slot baru (sisa ${e.sisa} dari ${e.max})`;
}

function susunEmail(groups: [string, Ev[]][]) {
  const semua = groups.flatMap(([, ev]) => ev);
  const n = (t: Ev["t"]) => semua.filter((e) => e.t === t).length;
  const bagian = [
    n("baru") ? `${n("baru")} pendaftar baru` : "",
    n("mulai") ? `${n("mulai")} pendaftar H-7 mulai` : "",
    n("keluar") ? `${n("keluar")} peserta akan berakhir` : "",
    n("kuota") ? `kuota terbuka di ${n("kuota")} kantor` : "",
  ].filter(Boolean);
  const subject = `[Magang BPJS] ${bagian.join(", ")}`;

  const text = groups.map(([k, ev]) => `${k}\n${ev.map((e) => `* ${baris(e)}`).join("\n")}`).join("\n\n");
  const html =
    `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">` +
    groups
      .map(
        ([k, ev]) =>
          `<p style="margin:16px 0 6px;font-weight:bold">${esc(k)}</p><ul style="margin:0;padding-left:20px">` +
          ev.map((e) => `<li style="margin:4px 0">${esc(baris(e))}</li>`).join("") +
          `</ul>`
      )
      .join("") +
    `</div>`;
  return { subject, text, html };
}

export async function jalankanNotifikasi(): Promise<{ ok: boolean; pesan: string }> {
  // Pembersihan data tidak bergantung pada email atau jam kerja
  await hapusKadaluarsa().catch((e) => console.error("[hapusKadaluarsa]", e));

  if (!emailSiap()) return { ok: false, pesan: BELUM_SIAP };
  if (!jamKerja()) {
    return { ok: true, pesan: "Di luar jam kerja (07.00-17.00 WIB), email dikirim pada jam kerja berikutnya." };
  }

  const [semuaPendaftar, peserta, kuota, cfg, log] = await Promise.all([
    listPendaftar(),
    listPeserta(),
    hitungKuota(),
    getConfig(),
    bacaLog(),
  ]);
  const today = hariIni();

  // Bersihkan: riwayat lama dan tanda-kirim milik pendaftar yang sudah dihapus
  log.riwayat = log.riwayat.filter((r) => !lewatRetensi(r.waktu, cfg.hapusHari));
  const idAda = new Set(semuaPendaftar.map((p) => p.id));
  for (const k of Object.keys(log.terkirim)) if (!idAda.has(k.split(":")[1])) delete log.terkirim[k];

  const grup: Record<string, Ev[]> = {};
  const tandai: string[] = [];
  const tambah = (id: string, e: Ev) => {
    if (!grup[id]) grup[id] = [];
    grup[id].push(e);
  };

  for (const p of semuaPendaftar) {
    if (!p.kantor || !getKantor(p.kantor)) continue;

    // 1) Pendaftar baru: langsung diberitahukan ke admin
    if (!log.terkirim[`baru:${p.id}`]) {
      const umur = selisihHari(tanggalWIB(p.waktu), today);
      if (umur >= 0 && umur <= BATAS_HARI_BARU) {
        tambah(p.kantor, { t: "baru", nama: p.nama, mulai: p.tanggalMulai, selesai: p.tanggalSelesai });
        tandai.push(`baru:${p.id}`);
      }
    }

    // 2) H-7 sebelum mulai dan masih menunggu keputusan
    if (statusOf(p) === "menunggu" && p.tanggalMulai && !log.terkirim[`mulai:${p.id}`]) {
      const sisa = selisihHari(today, p.tanggalMulai);
      if (sisa >= 0 && sisa <= HARI_MULAI) {
        tambah(p.kantor, { t: "mulai", nama: p.nama, mulai: p.tanggalMulai, sisa });
        tandai.push(`mulai:${p.id}`);
      }
    }
  }

  // 3) Peserta (diterima) yang akan keluar: H-21, H-14, H-7, H-3, dan hari terakhir (0)
  for (const p of peserta) {
    if (!p.kantor || !getKantor(p.kantor)) continue;
    const sisa = selisihHari(today, p.tanggalSelesai);
    const belum = TITIK_KELUAR.filter((m) => sisa <= m && !log.terkirim[`keluar:${p.id}:${m}`]);
    if (!belum.length) continue;
    tambah(p.kantor, { t: "keluar", nama: p.nama, selesai: p.tanggalSelesai, sisa });
    belum.forEach((m) => tandai.push(`keluar:${p.id}:${m}`));
  }

  // 4) Slot kuota yang terbuka
  const sisaBaru: Record<string, number> = {};
  for (const k of kuota) {
    sisaBaru[k.kantor.id] = k.sisa;
    const prev = log.kuota[k.kantor.id];
    if (prev !== undefined && k.sisa > prev) {
      tambah(k.kantor.id, { t: "kuota", buka: k.sisa - prev, sisa: k.sisa, max: k.max });
    }
  }

  const idKantor = Object.keys(grup);
  if (!idKantor.length) {
    log.kuota = sisaBaru;
    await tulisLog(log);
    return { ok: true, pesan: "Tidak ada notifikasi baru." };
  }

  if (!cfg.admin.length) return { ok: false, pesan: "Belum ada email admin yang diisi." };
  const groups = idKantor.map((id) => [getKantor(id)!.nama, grup[id]] as [string, Ev[]]);
  const { subject, text, html } = susunEmail(groups);
  const r: Riwayat = { waktu: new Date().toISOString(), subjek: subject, ke: cfg.admin, ok: true };
  let berhasil = false;
  try {
    await kirimEmail(cfg.admin, subject, text, html);
    berhasil = true;
  } catch (e) {
    r.ok = false;
    r.error = e instanceof Error ? e.message : "Gagal mengirim";
    console.error("[notifikasi]", e);
  }
  log.riwayat.unshift(r);

  if (berhasil) {
    const waktu = new Date().toISOString();
    tandai.forEach((k) => (log.terkirim[k] = waktu));
    log.kuota = sisaBaru;
  }
  await tulisLog(log);
  return berhasil
    ? { ok: true, pesan: "1 email terkirim." }
    : { ok: false, pesan: "Email gagal dikirim. Lihat riwayat di bawah untuk penyebabnya." };
}