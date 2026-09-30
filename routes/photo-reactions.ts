import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export const description = "Portfolio photo reactions (love/fire/wow counters)";

const FILE = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data", "photo-reactions.json");

const REACTIONS = new Set(["love", "fire", "wow"]);

type Store = Record<string, { love: number; fire: number; wow: number }>;

const load = (): Store => {
  try { return JSON.parse(readFileSync(FILE, "utf-8")); } catch { return {}; }
};
const save = (store: Store) => {
  mkdirSync(join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(store, null, 2));
};

export function GET(): Response {
  return Response.json(load());
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  const src = typeof body?.src === "string" ? body.src.slice(0, 200) : "";
  const reaction = typeof body?.reaction === "string" ? body.reaction : "";
  const undo = body?.undo === true;
  if (!src || !REACTIONS.has(reaction))
    return Response.json({ error: "src and reaction required" }, { status: 400 });
  const store = load();
  const old = store[src] ?? { love: 0, fire: 0, wow: 0 };
  const entry = { love: old.love ?? 0, fire: old.fire ?? 0, wow: old.wow ?? 0 };
  const key = reaction as "love" | "fire" | "wow";
  entry[key] = Math.max(0, entry[key] + (undo ? -1 : 1));
  store[src] = entry;
  save(store);
  return Response.json({ ok: true, [src]: entry });
}
