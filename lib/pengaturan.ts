import { KANTOR, KUOTA } from "./kantor";
import { redis } from "./store";

const KEY = "kuota";

export async function getKuotaMap(): Promise<Record<string, number>> {
  const saved = ((await redis.get<Record<string, unknown>>(KEY)) ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    KANTOR.map((k) => {
      const v = Number(saved[k.id]);
      return [k.id, Number.isInteger(v) && v >= 0 ? v : KUOTA[k.jenis]];
    })
  );
}

export async function simpanKuotaMap(map: Record<string, number>) {
  await redis.set(KEY, map);
}