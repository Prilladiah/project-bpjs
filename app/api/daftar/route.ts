import { NextResponse } from "next/server";
import { simpanPendaftar } from "@/lib/pendaftar";
import { getKantor } from "@/lib/kantor";
import { hitungKuota } from "@/lib/kuota";
import { jalankanNotifikasi } from "@/lib/notifikasi";
import { MAX_BULAN, MIN_BULAN, parseIso, selisihBulan, tambahBulan } from "@/lib/tanggal";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX = 1.4 * 1024 * 1024; // 3 file x 1,4 MB masih di bawah batas 4,5 MB Vercel
const err = (error: string, status = 400) => NextResponse.json({ error }, { status });

const isFile = (v: unknown): v is Blob =>
  typeof v === "object" && v !== null && typeof (v as Blob).arrayBuffer === "function";

async function cekPdf(file: unknown, nama: string) {
  if (!isFile(file) || file.size === 0) return `${nama} wajib diunggah.`;
  if (file.size > MAX) return `${nama} maksimal 1,4MB.`;
  const head = Buffer.from(await file.slice(0, 5).arrayBuffer()).toString("latin1");
  if (file.type !== "application/pdf" || head !== "%PDF-") return `${nama} harus berformat PDF.`;
  return null;
}

export async function POST(req: Request) {
  try {
    const f = await req.formData().catch(() => null);
    if (!f) return err("Data tidak valid.");

    const teks = (k: string) => String(f.get(k) ?? "").trim();
    const nama = teks("nama"), email = teks("email"), hp = teks("hp");
    const universitas = teks("universitas"), jurusan = teks("jurusan");
    const tanggalMulai = teks("tanggalMulai"), tanggalSelesai = teks("tanggalSelesai");

    if (!nama || !email || !hp || !universitas || !jurusan) return err("Semua kolom wajib diisi.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return err("Format email tidak valid.");

    const kantor = getKantor(teks("kantor"));
    if (!kantor) return err("Pilih kantor tujuan magang.");

    if (!parseIso(tanggalMulai) || !parseIso(tanggalSelesai)) return err("Tanggal mulai dan selesai wajib diisi.");
    if (tanggalSelesai < tambahBulan(tanggalMulai, MIN_BULAN)) return err(`Periode magang minimal ${MIN_BULAN} bulan.`);
    if (tanggalSelesai > tambahBulan(tanggalMulai, MAX_BULAN)) return err(`Periode magang maksimal ${MAX_BULAN} bulan.`);
    const durasi = selisihBulan(tanggalMulai, tanggalSelesai);

    const info = (await hitungKuota()).find((k) => k.kantor.id === kantor.id);
    if (info?.penuh) return err("Kuota Magang Dikantor Ini Sudah Full Anda Bisa Memilih Kantor Lain !", 409);

    const cv = f.get("cv"), surat = f.get("surat"), proposal = f.get("proposal");
    for (const [file, label] of [[cv, "CV"], [surat, "Surat permohonan"], [proposal, "Proposal"]] as const) {
      const e = await cekPdf(file, label);
      if (e) return err(e);
    }

    await simpanPendaftar(
      { nama, email, hp, universitas, jurusan, durasi, kantor: kantor.id, tanggalMulai, tanggalSelesai },
      { cv: cv as Blob, surat: surat as Blob, proposal: proposal as Blob }
    );

    // Cek notifikasi segera (terkirim hanya di jam kerja 07.00-17.00 WIB).
    // Kegagalan email tidak membatalkan pendaftaran.
    try {
      await jalankanNotifikasi();
    } catch (e) {
      console.error("[/api/daftar] notifikasi", e);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/daftar]", e);
    return err("Gagal menyimpan data. Coba lagi.", 500);
  }
}