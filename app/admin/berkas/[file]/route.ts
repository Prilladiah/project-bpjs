import { cookies } from "next/headers";
import { COOKIE, verifyToken } from "@/lib/auth";
import { getPendaftar, namaAman } from "@/lib/pendaftar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { file: string } }) {
  if (!(await verifyToken(cookies().get(COOKIE)?.value))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const m = /^([\w-]+)\.zip$/.exec(params.file);
  if (!m) return new Response("Format file tidak valid", { status: 404 });

  const p = await getPendaftar(m[1]);
  if (!p?.zipUrl) return new Response("File ZIP tidak ada", { status: 404 });

  const upstream = await fetch(p.zipUrl, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) return new Response("File ZIP tidak bisa dibaca", { status: 502 });

  const filename = `${namaAman(p.nama)}.zip`;
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="berkas.zip"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
}