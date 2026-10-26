import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, verifyToken } from "@/lib/auth";
import { setPassword, verifyLogin } from "@/lib/admin";

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function POST(req: Request) {
  const session = await verifyToken(cookies().get(COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  const user = String(session.user ?? "");

  const b = await req.json().catch(() => ({}));
  const lama = String(b.lama ?? "").trim();
  const baru = String(b.baru ?? "").trim();
  const konfirmasi = String(b.konfirmasi ?? "").trim();

  if (!(await verifyLogin(user, lama))) return bad("Password lama salah.");
  if (baru.length < 8) return bad("Password baru minimal 8 karakter.");
  if (baru !== konfirmasi) return bad("Konfirmasi password tidak sama.");
  if (baru === lama) return bad("Password baru harus berbeda dari password lama.");

  await setPassword(user, baru);
  return NextResponse.json({ ok: true });
}