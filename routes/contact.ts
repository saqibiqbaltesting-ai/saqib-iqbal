import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { readToken } from "./auth.js";

export const description = "Contact form — visitor messages with spam protection, owner reads via admin";

const DIR = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data");
const FILE = join(DIR, "contact-msgs.json");
const OWNER = "fizanali6267@gmail.com";

type Msg = { id: string; name: string; email: string; subject: string; message: string; ts: number; read?: boolean };

const load = (): Msg[] => {
  try {
    const d = JSON.parse(readFileSync(FILE, "utf-8"));
    return Array.isArray(d.msgs) ? d.msgs : [];
  } catch {
    return [];
  }
};

const save = (msgs: Msg[]) => {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify({ msgs }));
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// simple in-memory rate limit: max 5 messages per IP per 10 minutes
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (arr.length >= 5) { hits.set(ip, arr); return true; }
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url, "http://localhost");
  const claims = readToken(String(url.searchParams.get("token") ?? ""));
  if (!claims || claims.email !== OWNER)
    return Response.json({ ok: false, error: "denied" }, { status: 403 });
  return Response.json({ ok: true, msgs: load().slice(-50).reverse() });
}

export async function POST(req: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try { body = await req.json().catch(() => ({})); } catch { body = {}; }

  if (body.action === "read") {
    const claims = readToken(String(body.token ?? ""));
    if (!claims || claims.email !== OWNER)
      return Response.json({ ok: false, error: "denied" }, { status: 403 });
    const msgs = load();
    msgs.forEach((m) => (m.read = true));
    save(msgs);
    return Response.json({ ok: true });
  }

  // honeypot: real visitors never fill this hidden field — bots do. Drop silently.
  if (String(body.website ?? body.hp ?? "").trim() !== "") {
    return Response.json({ ok: true }, { status: 201 });
  }

  const ip = String(req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (rateLimited(ip))
    return Response.json({ ok: false, error: "slow_down" }, { status: 429 });

  const name = String(body.name ?? "").trim().slice(0, 24) || "Mehman";
  const email = String(body.email ?? "").trim().slice(0, 80);
  const subject = String(body.subject ?? "").trim().slice(0, 120);
  const message = String(body.message ?? "").trim().slice(0, 1000);

  if (!message)
    return Response.json({ ok: false, error: "no_message" }, { status: 400 });
  if (email && !EMAIL_RE.test(email))
    return Response.json({ ok: false, error: "bad_email" }, { status: 400 });

  const msgs = load();
  msgs.push({
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    name, email, subject, message, ts: Date.now(),
  });
  save(msgs.slice(-200));
  return Response.json({ ok: true }, { status: 201 });
}
