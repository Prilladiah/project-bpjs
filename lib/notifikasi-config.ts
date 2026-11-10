import { redis } from "./store";

export type NotifConfig = {
  admin: string[];
  mentor: Record<string, string[]>;
  hapusHari: number; // riwayat notifikasi dihapus setelah sekian hari
};

const KEY = "notifikasi-config";
const EMAIL = /^\S+@\S+\.\S+$/;

export function parseEmails(s: string): string[] {
  return Array.from(
    new Set(s.split(/[,;\s]+/).map((x) => x.trim().toLowerCase()).filter((x) => EMAIL.test(x)))
  );
}

export async function getConfig(): Promise<NotifConfig> {
  const saved = (await redis.get<Partial<NotifConfig>>(KEY)) ?? {};
  const admin = saved.admin?.length ? saved.admin : parseEmails(process.env.ADMIN_EMAIL ?? "");
  const h = Number(saved.hapusHari);
  return { admin, mentor: saved.mentor ?? {}, hapusHari: Number.isInteger(h) && h >= 1 ? h : 30 };
}

export async function simpanConfig(c: NotifConfig) {
  await redis.set(KEY, c);
}