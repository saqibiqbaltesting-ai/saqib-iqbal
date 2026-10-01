import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export const description = "Poetry sher like counters (totals visible to everyone)";

const FILE = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data", "sher-likes.json");

type Store = Record<string, number>;

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
  const id = typeof body?.id === "string" ? body.id.slice(0, 100) : "";
  const undo = body?.undo === true;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const store = load();
  store[id] = Math.max(0, (store[id] ?? 0) + (undo ? -1 : 1));
  save(store);
  return Response.json({ ok: true, [id]: store[id] });
}
