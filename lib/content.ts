import { Redis } from "@upstash/redis";
import defaultContent from "@/data/content.json";
import type { Content } from "@/types/content";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN!,
});

const KEY = "content";

export const getContent = async (): Promise<Content> => {
  try {
    const data = await redis.get<Content>(KEY);
    return data ?? (defaultContent as unknown as Content);
  } catch {
    return defaultContent as unknown as Content;
  }
};

export const saveContent = async (c: Content): Promise<void> => {
  await redis.set(KEY, c);
};