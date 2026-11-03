import { getKantor, HARI_SLOT_KEMBALI } from "./kantor";
import { hitungKuota, listPeserta } from "./kuota";
import { getConfig } from "./notifikasi-config";
import { emailSiap, kirimEmail } from "./email";
import { hariIni, selisihHari } from "./tanggal";
import { redis } from "./store";

export const MILESTONE = [21, 14, 7, 3];

type Ev =
  | { t: "keluar"; nama: string; selesai: string; sisa: number }
  | { t: "kuota"; buka: number; sisa: number; max: number };

export type Riwayat = { waktu: string; subjek: string; ke: string[]; ok: boolean; error?: string };
type Log = { terkirim: Record<string, string>; kuota: Record<string, number>; riwayat: Riwayat[] };

const LOG_KEY = "notifikasi-log";
const BELUM_SIAP = "Email belum diatur: isi APPS_SCRIPT_URL dan APPS_SCRIPT_SECRET di Environment Variables.";

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
  if (e.t === "keluar") {
    const kapan = e.sisa <= 0 ? "hari ini" : `${e.sisa} hari lagi`;
    const slot = e.sisa <= HARI_SLOT_KEMBALI ? " — slot kuota sudah dihitung kosong" : "";
    return `${e.nama} berakhir magang ${tgl(e.selesai)} (${kapan})${slot}`;
  }
  return `Kuota terbuka: ${e.buka} slot baru (sisa ${e.sisa} dari ${e.max})`;
}

function susunEmail(groups: [string, Ev[]][]) {
  const semua = groups.flatMap(([, ev]) => ev);
  const nKeluar = semua.filter((e) => e.t === "keluar").length;
  const nKuota = semua.filter((e) => e.t === "kuota").length;
  const bagian = [
    nKeluar ? `${nKeluar} peserta akan berakhir` : "",
    nKuota ? `kuota terbuka di ${nKuota} kantor` : "",
  ].filter(Boolean);
  const subject = `[Magang BPJS] ${bagian.join(", ")}`;

  const link = process.env.APP_URL ? `${process.env.APP_URL}/admin/magang` : "";
  const text =
    groups.map(([k, ev]) => `${k}\n${ev.map((e) => `- ${baris(e)}`).join("\n")}`).join("\n\n") +
    (link ? `\n\nBuka dashboard: ${link}` : "");
  const html =
    `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">` +
    groups
      .map(
        ([k, ev]) =>
          `<h3 style="margin:16px 0 6px">${esc(k)}</h3><ul style="margin:0;padding-left:20px">` +
          ev.map((e) => `<li style="margin:4px 0">${esc(baris(e))}</li>`).join("") +
          `</ul>`
      )
      .join("") +
    (link ? `<p style="margin-top:20px"><a href="${esc(link)}">Buka dashboard peserta magang</a></p>` : "") +
    `</div>`;
  return { subject, text, html };
}

export async function jalankanNotifikasi(): Promise<{ ok: boolean; pesan: string }> {
  if (!emailSiap()) return { ok: false, pesan: BELUM_SIAP };

  const [peserta, kuota, cfg, log] = await Promise.all([listPeserta(), hitungKuota(), getConfig(), bacaLog()]);
  const today = hariIni();
  const grup: Record<string, Ev[]> = {};
  const tandai: string[] = [];
  const tambah = (id: string, e: Ev) => {
    if (!grup[id]) grup[id] = [];
    grup[id].push(e);
  };

  for (const p of peserta) {
    if (!p.kantor || !getKantor(p.kantor)) continue;
    const sisa = selisihHari(today, p.tanggalSelesai);
    const belum = MILESTONE.filter((m) => sisa <= m && !log.terkirim[`keluar:${p.id}:${m}`]);
    if (!belum.length) continue;
    tambah(p.kantor, { t: "keluar", nama: p.nama, selesai: p.tanggalSelesai, sisa });
    belum.forEach((m) => tandai.push(`keluar:${p.id}:${m}`));
  }

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
  if (!surat.length) return { ok: false, pesan: "Belum ada email admin atau mentor yang diisi." };

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

export async function kirimUji(): Promise<{ ok: boolean; pesan: string }> {
  if (!emailSiap()) return { ok: false, pesan: BELUM_SIAP };
  const cfg = await getConfig();
  if (!cfg.admin.length) return { ok: false, pesan: "Isi email admin dulu." };
  const subjek = "[Magang BPJS] Email uji";
  const r: Riwayat = { waktu: new Date().toISOString(), subjek, ke: cfg.admin, ok: true };
  try {
    await kirimEmail(
      cfg.admin,
      subjek,
      "Ini email uji dari website magang. Jika Anda menerima ini, pengaturan email sudah benar.",
      "<p>Ini email uji dari website magang. Jika Anda menerima ini, pengaturan email sudah benar.</p>"
    );
  } catch (e) {
    r.ok = false;
    r.error = e instanceof Error ? e.message : "Gagal mengirim";
  }
  const log = await bacaLog();
  log.riwayat.unshift(r);
  await tulisLog(log);
  return r.ok
    ? { ok: true, pesan: `Email uji terkirim ke ${cfg.admin.join(", ")}.` }
    : { ok: false, pesan: `Gagal: ${r.error}` };
}