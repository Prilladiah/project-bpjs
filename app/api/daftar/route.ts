import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { addPendaftar } from "@/lib/pendaftar";

const MAX = 2 * 1024 * 1024;
const isPdf = (b: Buffer) => b.subarray(0, 5).toString() === "%PDF-";
const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function POST(req: Request) {
  const f = await req.formData().catch(() => null);
  if (!f) return bad("Data tidak valid.");
  const t = (k: string) => String(f.get(k) ?? "").trim();
  const nama = t("nama"), email = t("email"), hp = t("hp"), universitas = t("universitas"), jurusan = t("jurusan");
  const durasi = Number(t("durasi"));

  if (!nama || !universitas || !jurusan) return bad("Semua kolom wajib diisi.");
  if ([nama, universitas, jurusan].some((s) => s.length > 120)) return bad("Isian terlalu panjang.");
  if (!/^\S+@\S+\.\S+$/.test(email)) return bad("Format email tidak valid.");
  if (!/^[0-9+\s-]{8,16}$/.test(hp)) return bad("Nomor HP tidak valid.");
  if (!Number.isInteger(durasi) || durasi < 3 || durasi > 24) return bad("Durasi magang minimal 3 bulan.");

  const cv = f.get("cv"), surat = f.get("surat");
  if (!(cv instanceof File) || !(surat instanceof File)) return bad("CV dan surat permohonan wajib diunggah.");
  if (cv.size > MAX || surat.size > MAX) return bad("Ukuran file maksimal 2MB.");
  const cvBuf = Buffer.from(await cv.arrayBuffer()), suratBuf = Buffer.from(await surat.arrayBuffer());
  if (!isPdf(cvBuf) || !isPdf(suratBuf)) return bad("File harus berformat PDF.");

  await addPendaftar(
    { id: randomUUID(), waktu: new Date().toISOString(), nama, email, hp, universitas, jurusan, durasi },
    cvBuf, suratBuf,
  );
  return NextResponse.json({ ok: true });
}