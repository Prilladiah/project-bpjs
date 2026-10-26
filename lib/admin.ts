import { promises as fs } from "fs";
import path from "path";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const file = path.join(process.cwd(), "data", "admin.json");
type Stored = { username: string; salt: string; hash: string };

const hash = (pw: string, salt: string) => scryptSync(pw, salt, 64).toString("hex");
const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

async function read(): Promise<Stored | null> {
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return null; }
}

/** True jika sudah ada password tersimpan, atau ADMIN_PASSWORD terbaca dari .env.local */
export async function adminConfigured() {
  return !!(await read()) || !!(process.env.ADMIN_PASSWORD ?? "").trim();
}

/** Cek login. Password hasil "Ubah password" (data/admin.json) diprioritaskan dibanding .env.local */
export async function verifyLogin(username: string, password: string) {
  const s = await read();
  if (s) return same(username, s.username) && same(hash(password, s.salt), s.hash);
  const u = (process.env.ADMIN_USERNAME ?? "admin").trim();
  const p = (process.env.ADMIN_PASSWORD ?? "").trim();
  return !!p && same(username, u) && same(password, p);
}

export async function setPassword(username: string, password: string) {
  const salt = randomBytes(16).toString("hex");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify({ username, salt, hash: hash(password, salt) }, null, 2), { encoding: "utf8", mode: 0o600 });
}