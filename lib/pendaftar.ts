import { promises as fs } from "fs";
import path from "path";

export const PENDAFTAR_DIR = path.join(process.cwd(), "data", "pendaftar");
const indexFile = path.join(PENDAFTAR_DIR, "index.json");

export type Pendaftar = {
  id: string; waktu: string; nama: string; email: string; hp: string;
  universitas: string; jurusan: string; durasi: number;
};

export async function listPendaftar(): Promise<Pendaftar[]> {
  try { return JSON.parse(await fs.readFile(indexFile, "utf8")); } catch { return []; }
}

export async function addPendaftar(p: Pendaftar, cv: Buffer, surat: Buffer) {
  await fs.mkdir(PENDAFTAR_DIR, { recursive: true });
  await fs.writeFile(path.join(PENDAFTAR_DIR, `${p.id}-cv.pdf`), cv);
  await fs.writeFile(path.join(PENDAFTAR_DIR, `${p.id}-surat.pdf`), surat);
  const all = await listPendaftar();
  all.unshift(p);
  await fs.writeFile(indexFile, JSON.stringify(all, null, 2), "utf8");
}

export async function hapusPendaftar(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  const all = await listPendaftar();
  await fs.writeFile(indexFile, JSON.stringify(all.filter((p) => p.id !== id), null, 2), "utf8");
  await Promise.all(["cv", "surat"].map((k) => fs.rm(path.join(PENDAFTAR_DIR, `${id}-${k}.pdf`), { force: true })));
}