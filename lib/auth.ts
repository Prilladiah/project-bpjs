import { SignJWT, jwtVerify } from "jose";
export const COOKIE = "admin_token";
const key = () => new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-ganti-di-production-32chars");
export const signToken = (user: string) =>
  new SignJWT({ user }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("8h").sign(key());
export async function verifyToken(t?: string) {
  if (!t) return null;
  try { return (await jwtVerify(t, key())).payload; } catch { return null; }
}
