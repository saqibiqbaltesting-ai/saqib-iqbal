import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { readToken } from "./auth.js";

export const description = "Aap ka Sher — visitor sher submissions (owner approves)";

const ROOT = process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data";
const FILE = join(ROOT, "data", "user-shers.json");
const OWNER = "fizanali6267@gmail.com";

type UserSher = { id: string; text: string; name: string; approved: boolean; ts: number };

const load = (): UserSher[] => {
  try { return JSON.parse(readFileSync(FILE, "utf-8")); } catch { return []; }
};
const save = (items: UserSher[]) => {
  mkdirSync(join(ROOT, "data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(items, null, 2));
};

const pub = (items: UserSher[]) =>
  items
    .filter((s) => s.approved)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 60)
    .map((s) => ({ id: s.id, text: s.text, name: s.name }));

export function GET(): Response {
  return Response.json({ ok: true, shers: pub(load()) });
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "submit");
  const items = load();

  if (action === "submit") {
    const text = String(body?.sher ?? "").replace(/\s+/g, " ").trim().slice(0, 400);
    const name = String(body?.name ?? "").replace(/\s+/g, " ").trim().slice(0, 40) || "Gumnam Shakhs";
    if (text.length < 10) return Response.json({ ok: false, error: "Sher thora lamba likhein" }, { status: 400 });
    if (items.length > 2000) return Response.json({ ok: false, error: "Filhaal submissions band hain" }, { status: 429 });
    const s: UserSher = { id: "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, name, approved: false, ts: Date.now() };
    items.push(s);
    save(items);
    return Response.json({ ok: true, id: s.id });
  }

  const claims = readToken(String(body?.token ?? ""));
  if (!claims || claims.email !== OWNER)
    return Response.json({ ok: false, error: "denied" }, { status: 403 });

  if (action === "approve") {
    const id = String(body?.id ?? "");
    const s = items.find((x) => x.id === id);
    if (!s) return Response.json({ ok: false, error: "not found" }, { status: 404 });
    s.approved = true;
    save(items);
    return Response.json({ ok: true });
  }
  if (action === "delete") {
    const id = String(body?.id ?? "");
    const next = items.filter((x) => x.id !== id);
    save(next);
    return Response.json({ ok: true });
  }
  if (action === "list-all") {
    return Response.json({ ok: true, shers: pub(items), pending: items.filter((x) => !x.approved).sort((a, b) => b.ts - a.ts).slice(0, 100) });
  }
  return Response.json({ ok: false, error: "unknown action" }, { status: 400 });
}
