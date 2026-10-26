import { promises as fs } from "fs";
import path from "path";
import type { Content } from "@/types/content";

const file = path.join(process.cwd(), "data", "content.json");
export const getContent = async (): Promise<Content> => JSON.parse(await fs.readFile(file, "utf8"));
export const saveContent = (c: Content) => fs.writeFile(file, JSON.stringify(c, null, 2), "utf8");
