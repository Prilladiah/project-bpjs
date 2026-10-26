import { NextResponse } from "next/server";
import { COOKIE, signToken } from "@/lib/auth";
import { adminConfigured, verifyLogin } from "@/lib/admin";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "").trim();

  if (!(await adminConfigured())) {
    console.warn("[login] ADMIN_PASSWORD belum terbaca. Pastikan .env.local ada di folder yang sama dengan package.json, lalu restart server.");
    const dev = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      { error: dev ? "ADMIN_PASSWORD belum terbaca dari .env.local (cek nama file lalu restart server)." : "Username atau kata sandi salah." },
      { status: dev ? 500 : 401 },
    );
  }

  if (!(await verifyLogin(username, password)))
    return NextResponse.json({ error: "Username atau kata sandi salah." }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await signToken(username), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8,
  });
  return res;
}