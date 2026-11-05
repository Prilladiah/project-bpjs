import { getKantor, HARI_SLOT_KEMBALI } from "./kantor";
import { hitungKuota, listPeserta } from "./kuota";
import { listPendaftar } from "./pendaftar";
import { getConfig } from "./notifikasi-config";
import { emailSiap, kirimEmail } from "./email";
import { hariIni, selisihHari } from "./tanggal";
import { redis } from "./store";

export const MILESTONE = [21, 14, 7, 3];

// Email hanya dikirim pada jam kerja (WIB)
const JAM_MULAI = 7;
const JAM_SELESAI = 17;
// Pendaftar baru diberi notifikasi maksimal sampai sekian hari setelah mendaftar
const BATAS_HARI_BARU = 7;

type Ev =
  | { t: "baru"; nama: string; mulai?: string; selesai?: string }
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

// Tanggal (yyyy-mm-dd, zona WIB) dari waktu ISO
const tanggalWIB = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date(iso));

async function bacaLog(): Promise<Log> {
  const l = await redis.get<Partial<Log>>(LOG_KEY);
  return { terkirim: l?.terkirim ?? {}, kuota: l?.kuota ?? {}, riwayat: l?.riwayat ?? [] };
}

async function tulisLog(l: Log) {
  await redis.set(LOG_KEY, { ...l, riwayat: l.riwayat.slice(0, 30) });
}

export async function getRiwayat() {
  return (await bacaLog()).riwayat;
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
  if (e.t === "keluar") {
    const kapan = e.sisa <= 0 ? "hari ini" : `${e.sisa} hari lagi`;
    const slot = e.sisa <= HARI_SLOT_KEMBALI ? " — slot kuota sudah dihitung kosong" : "";
    return `${e.nama} berakhir magang ${tgl(e.selesai)} (${kapan})${slot}`;
  }
  return `Kuota terbuka: ${e.buka} slot baru (sisa ${e.sisa} dari ${e.max})`;
}

function susunEmail(groups: [string, Ev[]][]) {
  const semua = groups.flatMap(([, ev]) => ev);
  const nBaru = semua.filter((e) => e.t === "baru").length;
  const nKeluar = semua.filter((e) => e.t === "keluar").length;
  const nKuota = semua.filter((e) => e.t === "kuota").length;
  const bagian = [
    nBaru ? `${nBaru} pendaftar baru` : "",
    nKeluar ? `${nKeluar} peserta akan berakhir` : "",
    nKuota ? `kuota terbuka di ${nKuota} kantor` : "",
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
  const grup: Record<string, Ev[]> = {};
  const tandai: string[] = [];
  const tambah = (id: string, e: Ev) => {
    if (!grup[id]) grup[id] = [];
    grup[id].push(e);
  };

  // 1) Pendaftar baru: dikirim mulai hari setelah mendaftar, berapa pun sisa harinya
  for (const p of semuaPendaftar) {
    if (!p.kantor || !getKantor(p.kantor)) continue;
    if (log.terkirim[`baru:${p.id}`]) continue;
    const umur = selisihHari(tanggalWIB(p.waktu), today);
    if (umur < 1 || umur > BATAS_HARI_BARU) continue;
    tambah(p.kantor, { t: "baru", nama: p.nama, mulai: p.tanggalMulai, selesai: p.tanggalSelesai });
    tandai.push(`baru:${p.id}`);
  }

  // 2) Peserta yang akan keluar (H-21, H-14, H-7, H-3)
  for (const p of peserta) {
    if (!p.kantor || !getKantor(p.kantor)) continue;
    const sisa = selisihHari(today, p.tanggalSelesai);
    const belum = MILESTONE.filter((m) => sisa <= m && !log.terkirim[`keluar:${p.id}:${m}`]);
    if (!belum.length) continue;
    tambah(p.kantor, { t: "keluar", nama: p.nama, selesai: p.tanggalSelesai, sisa });
    belum.forEach((m) => tandai.push(`keluar:${p.id}:${m}`));
  }

  // 3) Slot kuota yang terbuka
  const sisaBaru: Record<string, number> = {};
  for (const k of kuota) {
    sisaBaru[k.kantor.id] = k.sisa;
    const prev = log.kuota[k.kantor.id];
    if (prev !== undefined && k.sisa > prev) {
      tambah(k.kantor.id, { t: "kuota", buka: k.sisa - prev, sisa: k.sisa, max: k.max });
    }
  }

  const ids = Object.keys(grup);
  if (!ids.length) {
    log.kuota = sisaBaru;
    await tulisLog(log);
    return { ok: true, pesan: "Tidak ada notifikasi baru." };
  }

  const surat: { to: string[]; groups: [string, Ev[]][] }[] = [];
  if (cfg.admin.length) {
    surat.push({ to: cfg.admin, groups: ids.map((id) => [getKantor(id)!.nama, grup[id]] as [string, Ev[]]) });
  }
  for (const id of ids) {
    const to = (cfg.mentor[id] ?? []).filter((e) => !cfg.admin.includes(e));
    if (to.length) surat.push({ to, groups: [[getKantor(id)!.nama, grup[id]]] });
  }
  if (!surat.length) return { ok: false, pesan: "Belum ada email admin yang diisi." };

  let berhasil = 0;
  for (const s of surat) {
    const { subject, text, html } = susunEmail(s.groups);
    const r: Riwayat = { waktu: new Date().toISOString(), subjek: subject, ke: s.to, ok: true };
    try {
      await kirimEmail(s.to, subject, text, html);
      berhasil++;
    } catch (e) {
      r.ok = false;
      r.error = e instanceof Error ? e.message : "Gagal mengirim";
      console.error("[notifikasi]", e);
    }
    log.riwayat.unshift(r);
  }

  if (berhasil > 0) {
    const waktu = new Date().toISOString();
    tandai.forEach((k) => (log.terkirim[k] = waktu));
    log.kuota = sisaBaru;
  }
  await tulisLog(log);
  return berhasil > 0
    ? { ok: true, pesan: `${berhasil} email terkirim.` }
    : { ok: false, pesan: "Email gagal dikirim. Lihat riwayat di bawah untuk penyebabnya." };
}