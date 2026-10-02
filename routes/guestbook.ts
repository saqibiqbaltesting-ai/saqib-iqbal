import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { readToken } from "./auth.js";

export const description = "Portfolio guestbook — JSON file storage, with edit/delete/reply";

const FILE = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data", "guestbook.json");
const OWNER = "fizanali6267@gmail.com";

type Entry = { id: string; name: string; message: string; email?: string; createdAt: string; parentId?: string; reactions?: Record<string, string[]> };

const load = (): Entry[] => {
  try { return JSON.parse(readFileSync(FILE, "utf-8")); } catch { return []; }
};
const save = (entries: Entry[]) => {
  mkdirSync(join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(entries, null, 2));
};

// token -> email, or null (stateless signed tokens — see auth.ts readToken)
const auth = (body: any): string | null => {
  const p = readToken(String(body?.token ?? ""));
  return p ? p.email.toLowerCase() : null;
};

export function GET(req: Request): Response {
  const all = load();
  const tops = all.filter((e) => !e.parentId);
  // mera email (token query se) — "mine" highlight ke liye
  let me: string | null = null;
  try {
    const url = new URL(req.url);
    me = auth({ token: String(url.searchParams.get("token") ?? "") });
  } catch { me = null; }
  const rx = (e: Entry) => {
    const r = e.reactions ?? {};
    const out: Record<string, number | boolean> = {};
    for (const k of ["love", "fire", "laugh"]) {
      out[k] = Array.isArray(r[k]) ? r[k].length : 0;
      if (me) out[k + "_mine"] = Array.isArray(r[k]) && r[k].includes(me);
    }
    return out;
  };
  const withRx = (e: Entry) => ({
    ...e,
    reactions: rx(e),
    replies: all.filter((r) => r.parentId === e.id).map((r) => ({ ...r, reactions: rx(r) })),
  });
  return Response.json(tops.map(withRx));
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";

  // ---- ME (who am I) ----
  if (action === "me") {
    const email = auth(body);
    if (!email) return Response.json({ error: "auth required" }, { status: 401 });
    return Response.json({ ok: true, email });
  }

  // ---- REACT (emoji) ----
  if (action === "react") {
    const email = auth(body);
    if (!email) return Response.json({ error: "auth required" }, { status: 401 });
    const id = String(body?.id ?? "");
    const emoji = String(body?.emoji ?? "");
    if (!["love", "fire", "laugh"].includes(emoji)) return Response.json({ error: "bad emoji" }, { status: 400 });
    const entries = load();
    const t = entries.find((e) => e.id === id);
    if (!t) return Response.json({ error: "not found" }, { status: 404 });
    if (!t.reactions) t.reactions = {};
    const list = Array.isArray(t.reactions[emoji]) ? t.reactions[emoji]! : [];
    const at = list.indexOf(email);
    if (at === -1) list.push(email);
    else list.splice(at, 1);
    t.reactions[emoji] = list;
    save(entries);
    return Response.json({ ok: true, love: (t.reactions.love ?? []).length, fire: (t.reactions.fire ?? []).length, laugh: (t.reactions.laugh ?? []).length });
  }

  // ---- DELETE ----
  if (action === "delete") {
    const email = auth(body);
    if (!email) return Response.json({ error: "auth required" }, { status: 401 });
    const id = String(body?.id ?? "");
    const entries = load();
    const t = entries.find((e) => e.id === id);
    if (!t) return Response.json({ error: "not found" }, { status: 404 });
    const own = (t.email || "") === email;
    if (!own && email !== OWNER) return Response.json({ error: "denied" }, { status: 403 });
    const keep = entries.filter((e) => e.id !== id && e.parentId !== id);
    save(keep);
    return Response.json({ ok: true });
  }

  // ---- EDIT ----
  if (action === "edit") {
    const email = auth(body);
    if (!email) return Response.json({ error: "auth required" }, { status: 401 });
    const id = String(body?.id ?? "");
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, 1000) : "";
    if (!message) return Response.json({ error: "message required" }, { status: 400 });
    const entries = load();
    const t = entries.find((e) => e.id === id);
    if (!t) return Response.json({ error: "not found" }, { status: 404 });
    if ((t.email || "") !== email) return Response.json({ error: "denied" }, { status: 403 });
    t.message = message;
    (t as any).edited = true;
    save(entries);
    return Response.json({ ok: true });
  }

  // ---- CREATE (comment or reply) ----
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 60) : "";
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 1000) : "";
  if (!name || !message) return Response.json({ error: "name and message required" }, { status: 400 });
  const sessionEmail = auth(body);
  const parentId = typeof body?.parentId === "string" && body.parentId ? String(body.parentId) : undefined;
  if (parentId && !sessionEmail) return Response.json({ error: "auth required to reply" }, { status: 401 });
  const entry: Entry = { id: crypto.randomUUID(), name, message, createdAt: new Date().toISOString() };
  if (sessionEmail) entry.email = sessionEmail;
  if (parentId) entry.parentId = parentId;
  const entries = load();
  entries.unshift(entry);
  save(entries.slice(0, 800));
  return Response.json(entry, { status: 201 });
}
