import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export const description = "Contact form — visitor messages, owner reads via crown panel";

const DIR = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data");
const FILE = join(DIR, "contact-msgs.json");
const OWNER = "fizanali6267@gmail.com";

type Msg = { id: string; name: string; email: string; message: string; ts: number; read?: boolean };

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

function tokenEmail(token: string): string | null {
  if (!token) return null;
  try {
    const db = JSON.parse(readFileSync(join(DIR, "portfolio-users.json"), "utf-8"));
    const s = (db.sessions ?? []).find(
      (x: Record<string, unknown>) => String(x.token ?? x.id ?? "") === token
    );
    return s ? String(s.email ?? "") : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const email = tokenEmail(String(url.searchParams.get("token") ?? ""));
  if (email !== OWNER) return Response.json({ ok: false, error: "denied" }, { status: 403 });
  return Response.json({ ok: true, msgs: load().slice(-50).reverse() });
}

export async function POST(req: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }
  if (body.action === "read") {
    const email = tokenEmail(String(body.token ?? ""));
    if (email !== OWNER) return Response.json({ ok: false, error: "denied" }, { status: 403 });
    const msgs = load();
    msgs.forEach((m) => (m.read = true));
    save(msgs);
    return Response.json({ ok: true });
  }
  const name = String(body.name ?? "").trim().slice(0, 24) || "Mehman";
  const email = String(body.email ?? "").trim().slice(0, 80);
  const message = String(body.message ?? "").trim().slice(0, 1000);
  if (!message) return Response.json({ ok: false, error: "no message" }, { status: 400 });
  const msgs = load();
  msgs.push({
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    name,
    email,
    message,
    ts: Date.now(),
  });
  save(msgs.slice(-200));
  return Response.json({ ok: true }, { status: 201 });
}
