import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { readToken } from "./auth.js";

export const description = "Portfolio admin — stats, contact messages and site settings (owner only)";

const D = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data");
const OWNER = "fizanali6267@gmail.com";
const SETTINGS_FILE = join(D, "site-settings.json");

const load = (f: string): any => {
  try { return JSON.parse(readFileSync(join(D, f), "utf-8")); } catch { return null; }
};

const loadSettings = (): any => {
  const s = load("site-settings.json");
  return s && typeof s === "object" ? s : { heroSub: "", social: {}, accent: "", updatedAt: 0 };
};

function saveSettings(s: any): boolean {
  try {
    mkdirSync(D, { recursive: true });
    writeFileSync(SETTINGS_FILE, JSON.stringify({ ...s, updatedAt: Date.now() }));
    return true;
  } catch { return false; }
}

// Public: current site customisation (safe to expose — no secrets here)
export async function GET(): Promise<Response> {
  const s = loadSettings();
  return Response.json({
    ok: true,
    settings: {
      heroSub: String(s.heroSub ?? ""),
      social: s.social && typeof s.social === "object" ? s.social : {},
      accent: String(s.accent ?? ""),
    },
  });
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const token = String(body?.token ?? "");
  const claims = readToken(token);
  if (!claims || claims.email !== OWNER)
    return Response.json({ ok: false, error: "denied" }, { status: 403 });

  if (body.action === "save-settings") {
    const cur = loadSettings();
    const next: any = { ...cur };
    if (typeof body.heroSub === "string") next.heroSub = body.heroSub.trim().slice(0, 200);
    if (body.social && typeof body.social === "object") {
      const social: Record<string, string> = {};
      for (const k of Object.keys(body.social).slice(0, 12)) {
        social[k.slice(0, 30)] = String(body.social[k] ?? "").slice(0, 200);
      }
      next.social = social;
    }
    if (typeof body.accent === "string") next.accent = body.accent.slice(0, 20);
    const ok = saveSettings(next);
    return Response.json({ ok, settings: next });
  }

  const vis = load("visitors.json") || { count: 0 };
  const gb = load("guestbook.json") || [];
  const pr = load("photo-reactions.json") || {};
  const cm = load("contact-msgs.json") || { msgs: [] };
  let reactions = 0;
  for (const k of Object.keys(pr)) {
    const v = (pr as any)[k];
    if (typeof v === "number") reactions += v;
    else if (v && typeof v === "object") reactions += Object.values(v).reduce((a: number, b: any) => a + (typeof b === "number" ? b : 0), 0);
  }

  return Response.json({
    ok: true,
    visitors: typeof vis.count === "number" ? vis.count : 0,
    users: ((dbSafe(load("portfolio-users.json")) || {}).users || []).length,
    messages: gb.length,
    reactions,
    contactCount: (cm.msgs || []).length,
    unread: (cm.msgs || []).filter((m: any) => !m.read).length,
    contact: (cm.msgs || []).slice(-15).reverse().map((m: any) => ({
      name: m.name, email: m.email, subject: m.subject, message: m.message, ts: m.ts, read: !!m.read,
    })),
    guestbook: (gb.length ? gb : []).slice(-20).reverse().map((m: any) => ({
      name: m.name, message: m.message, createdAt: m.createdAt,
    })),
    settings: loadSettings(),
  });
}

function dbSafe(db: any): any { return db && typeof db === "object" ? db : null; }
