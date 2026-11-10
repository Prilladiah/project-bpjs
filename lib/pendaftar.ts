import { randomUUID } from "crypto";
import JSZip from "jszip";
import { put, del } from "@vercel/blob";
import { redis } from "./store";
import { hariIni, tambahBulan } from "./tanggal";

export type Status = "menunggu" | "diterima" | "ditolak";

export type Pendaftar = {
  id: string;
  waktu: string;
  nama: string;
  email: string;
  hp: string;
  universitas: string;
  jurusan: string;
  durasi: number;
  kantor?: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  status?: Status; // data lama belum punya: dianggap "menunggu"
  diterimaPada?: string; // waktu admin menekan Terima
  zipUrl?: string;
};

export type Berkas = { cv: Blob; surat: Blob; proposal: Blob };

const HASH = "pendaftar";

export const statusOf = (p: Pendaftar): Status => p.status ?? "menunggu";

export function namaAman(nama: string) {
  return nama.replace(/[\\/:*?"<>|\x00-\x1f]/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || "Pendaftar";
}

export async function listPendaftar(): Promise<Pendaftar[]> {
  const all = await redis.hgetall<Record<string, Pendaftar>>(HASH);
  return Object.values(all ?? {}).sort((a, b) => b.waktu.localeCompare(a.waktu));
}

export async function getPendaftar(id: string) {
  return (await redis.hget<Pendaftar>(HASH, id)) ?? undefined;
}

export async function simpanPendaftar(
  data: Omit<Pendaftar, "id" | "waktu" | "zipUrl" | "status" | "diterimaPada">,
  berkas: Berkas
) {
  const id = randomUUID();

  const zip = new JSZip();
  const folder = zip.folder(namaAman(data.nama))!;
  folder.file("CV.pdf", await berkas.cv.arrayBuffer());
  folder.file("Surat Permohonan.pdf", await berkas.surat.arrayBuffer());
  folder.file("Proposal.pdf", await berkas.proposal.arrayBuffer());
  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  const blob = await put(`berkas/${id}.zip`, buf, {
    access: "public",
    addRandomSuffix: true,
    contentType: "application/zip",
  });

  const record: Pendaftar = {
    id,
    waktu: new Date().toISOString(),
    ...data,
    status: "menunggu",
    zipUrl: blob.url,
  };
  await redis.hset(HASH, { [id]: record });
  return record;
}

export async function ubahStatus(id: string, status: Status) {
  if (!/^[\w-]+$/.test(id)) return;
  const p = await getPendaftar(id);
  if (!p) return;
  const diterimaPada =
    status === "diterima" ? p.diterimaPada ?? new Date().toISOString() : undefined;
  await redis.hset(HASH, { [id]: { ...p, status, diterimaPada } });
}

export async function hapusPendaftar(id: string) {
  if (!/^[\w-]+$/.test(id)) return;
  const p = await getPendaftar(id);
  if (p?.zipUrl) await del(p.zipUrl).catch(() => {});
  await redis.hdel(HASH, id);
}

// Hapus pendaftar yang tanggal selesainya sudah lewat lebih dari 1 bulan
export async function hapusKadaluarsa(): Promise<number> {
  const today = hariIni();
  let n = 0;
  for (const p of await listPendaftar()) {
    if (p.tanggalSelesai && tambahBulan(p.tanggalSelesai, 1) < today) {
      await hapusPendaftar(p.id);
      n++;
    }
  }
  return n;
}

export const addPendaftar = simpanPendaftar;