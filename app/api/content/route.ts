import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getContent, saveContent } from "@/lib/content";

export const dynamic = "force-dynamic";
export const GET = async () => NextResponse.json(await getContent());

export async function PUT(req: Request) {
  const c = await req.json().catch(() => null);
  const ok = c && c.hero && Array.isArray(c.program) && Array.isArray(c.misi) && Array.isArray(c.informasi) &&
    Array.isArray(c.kontak) && Array.isArray(c.alamat) && typeof c.visi === "string";
  if (!ok) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  await saveContent(c);
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
