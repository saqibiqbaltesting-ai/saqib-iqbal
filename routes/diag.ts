import { loadJSON, saveJSON } from "./blob-store.js";

export const description = "Client error reports — lets the self-healing catcher tell the owner what broke";

// Errors the browser reports land here so the owner can see them without opening a
// console. Deliberately tiny and boring: capped list, short strings, no PII beyond
// what the browser already sends on any request.
const FILE = "client-errors.json";
type Rec = {
  kind: string;
  message: string;
  where: string;
  page: string;
  ua: string;
  ts: number;
};

const MAX_KEEP = 120;

// per-IP cap so a broken client cannot hammer this endpoint
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60 * 1000);
  if (arr.length >= 20) { hits.set(ip, arr); return true; }
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

const cut = (v: unknown, n: number) => String(v ?? "").replace(/[\r\n\t]/g, " ").slice(0, n);

export async function POST(req: Request): Promise<Response> {
  const ip = String(req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (rateLimited(ip)) return Response.json({ ok: false, error: "slow_down" }, { status: 429 });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }

  const rec: Rec = {
    kind: cut(body.kind, 24) || "unknown",
    message: cut(body.message, 300),
    where: cut(body.where, 200),
    page: cut(body.page, 120),
    ua: cut(body.ua, 140),
    ts: Number(body.ts) || Date.now(),
  };
  if (!rec.message) return Response.json({ ok: false, error: "empty" }, { status: 400 });

  let list: Rec[] = [];
  try {
    const j = (await loadJSON(FILE)) as { errors?: Rec[] } | null;
    if (j && Array.isArray(j.errors)) list = j.errors;
  } catch {}
  list.push(rec);
  await saveJSON(FILE, { errors: list.slice(-MAX_KEEP) });
  return Response.json({ ok: true }, { status: 201 });
}

// GET is owner-only: the list is diagnostic data, not public.
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url, "http://localhost");
  const { readToken } = await import("./auth.js");
  const OWNER = "fizanali6267@gmail.com";
  const claims = readToken(String(url.searchParams.get("token") ?? ""));
  if (!claims || claims.email.toLowerCase() !== OWNER.toLowerCase())
    return Response.json({ ok: false, error: "denied" }, { status: 403 });
  let list: Rec[] = [];
  try {
    const j = (await loadJSON(FILE)) as { errors?: Rec[] } | null;
    if (j && Array.isArray(j.errors)) list = j.errors;
  } catch {}
  return Response.json({ ok: true, errors: list.slice(-50).reverse() });
}
