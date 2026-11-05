import { Redis } from "@upstash/redis";
import defaultContent from "@/data/content.json";

// Fallback ke nama variabel lama (KV_*) kalau yang dipasang Vercel memakai nama itu
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN!,
});

const KEY = "content";

export async function getContent() {
  try {
    const data = await redis.get(KEY);
    return data ?? defaultContent;
  } catch {
    return defaultContent;
  }
}

export async function saveContent(content: unknown) {
  await redis.set(KEY, content);
}