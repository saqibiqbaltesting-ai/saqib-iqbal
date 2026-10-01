import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export const description = "Deewar e Dil — visitor heart counter";

const ROOT = process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data";
const FILE = join(ROOT, "data", "hearts.json");

const load = (): { count: number } => {
  try {
    const d = JSON.parse(readFileSync(FILE, "utf-8"));
    return { count: Math.max(0, parseInt(String(d?.count ?? 0), 10) || 0) };
  } catch { return { count: 0 }; }
};
const save = (d: { count: number }) => {
  mkdirSync(join(ROOT, "data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(d));
};

export function GET(): Response {
  return Response.json(load());
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const add = Math.max(1, Math.min(5, parseInt(String(body?.add ?? "1"), 10) || 1));
  const d = load();
  d.count = Math.min(9_999_999, d.count + add);
  save(d);
  return Response.json({ ok: true, count: d.count });
}
