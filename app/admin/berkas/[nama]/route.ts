import { promises as fs } from "fs";
import path from "path";
import { PENDAFTAR_DIR } from "@/lib/pendaftar";

export async function GET(_: Request, { params }: { params: { nama: string } }) {
  if (!/^[0-9a-f-]{36}-(cv|surat)\.pdf$/.test(params.nama)) return new Response("Tidak ditemukan", { status: 404 });
  try {
    const buf = await fs.readFile(path.join(PENDAFTAR_DIR, params.nama));
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${params.nama}"` },
    });
  } catch {
    return new Response("Tidak ditemukan", { status: 404 });
  }
}