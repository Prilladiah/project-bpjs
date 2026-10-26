import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ok = await verifyToken(req.cookies.get(COOKIE)?.value);
  if (pathname.startsWith("/api/content")) {
    if (req.method === "GET" || ok) return NextResponse.next();
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }
  if (pathname.startsWith("/api/password")) {
    if (ok) return NextResponse.next();
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }
  if (pathname.startsWith("/admin") && !ok) return NextResponse.redirect(new URL("/login", req.url));
  if (pathname === "/login" && ok) return NextResponse.redirect(new URL("/admin", req.url));
  return NextResponse.next();
}
export const config = { matcher: ["/admin/:path*", "/login", "/api/content", "/api/password"] };