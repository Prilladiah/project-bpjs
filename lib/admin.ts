import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { redis } from "./store";

const KEY = "admin-config";
type Stored = { username: string; salt: string; hash: string };

const hash = (pw: string, salt: string) => scryptSync(pw, salt, 64).toString("hex");
const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

async function read(): Promise<Stored | null> {
  try {
    return (await redis.get<Stored>(KEY)) ?? null;
  } catch {
    return null; // Redis bermasalah: login tetap bisa lewat variabel lingkungan
  }
}

/** True jika sudah ada password tersimpan, atau ADMIN_PASSWORD terbaca dari environment */
export async function adminConfigured() {
  return !!(await read()) || !!(process.env.ADMIN_PASSWORD ?? "").trim();
}

/** Cek login. Password hasil "Ubah password" (Redis) diprioritaskan dibanding environment variable */
export async function verifyLogin(username: string, password: string) {
  const s = await read();
  if (s) return same(username, s.username) && same(hash(password, s.salt), s.hash);
  const u = (process.env.ADMIN_USERNAME ?? "admin").trim();
  const p = (process.env.ADMIN_PASSWORD ?? "").trim();
  return !!p && same(username, u) && same(password, p);
}

export async function setPassword(username: string, password: string) {
  const salt = randomBytes(16).toString("hex");
  await redis.set(KEY, { username, salt, hash: hash(password, salt) });
}