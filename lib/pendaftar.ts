import { randomUUID } from "crypto";
import JSZip from "jszip";
import { put, del } from "@vercel/blob";
import { redis } from "./store";

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
  zipUrl?: string; // alamat ZIP di Vercel Blob
};

export type Berkas = { cv: Blob; surat: Blob; proposal: Blob };

const HASH = "pendaftar";

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

export async function simpanPendaftar(data: Omit<Pendaftar, "id" | "waktu" | "zipUrl">, berkas: Berkas) {
  const id = randomUUID();

  const zip = new JSZip();
  const folder = zip.folder(namaAman(data.nama))!;
  folder.file("CV.pdf", await berkas.cv.arrayBuffer());
  folder.file("Surat Permohonan.pdf", await berkas.surat.arrayBuffer());
  folder.file("Proposal.pdf", await berkas.proposal.arrayBuffer());
  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  const blob = await put(`berkas/${id}.zip`, buf, {
    access: "public",
    addRandomSuffix: true, // alamat tidak bisa ditebak; unduhan lewat halaman admin
    contentType: "application/zip",
  });

  const record: Pendaftar = { id, waktu: new Date().toISOString(), ...data, zipUrl: blob.url };
  await redis.hset(HASH, { [id]: record });
  return record;
}

export async function hapusPendaftar(id: string) {
  if (!/^[\w-]+$/.test(id)) return;
  const p = await getPendaftar(id);
  if (p?.zipUrl) await del(p.zipUrl).catch(() => {});
  await redis.hdel(HASH, id);
}

export const addPendaftar = simpanPendaftar;