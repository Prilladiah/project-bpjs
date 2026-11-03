import { NextResponse } from "next/server";
import { hitungKuota } from "@/lib/kuota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await hitungKuota();
  return NextResponse.json(
    Object.fromEntries(data.map((k) => [k.kantor.id, { terisi: k.terisi, max: k.max, penuh: k.penuh }])),
    { headers: { "Cache-Control": "no-store" } }
  );
}