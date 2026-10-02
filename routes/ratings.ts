import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { readToken } from "./auth.js";

export const description = "Site rating — 5 stars, one per user, average public";

const DIR = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data");
const FILE = join(DIR, "ratings.json");

const load = (): Record<string, number> => {
  try {
    const d = JSON.parse(readFileSync(FILE, "utf-8"));
    return d.ratings && typeof d.ratings === "object" ? d.ratings : {};
  } catch {
    return {};
  }
};

const save = (ratings: Record<string, number>) => {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify({ ratings }));
};

const emailOf = (token: string): string | null => {
  const p = readToken(String(token ?? ""));
  return p ? p.email.toLowerCase() : null;
};

export async function GET(req: Request): Promise<Response> {
  const ratings = load();
  const vals = Object.values(ratings);
  const avg = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
  const url = new URL(req.url);
  const me = emailOf(String(url.searchParams.get("token") ?? ""));
  return Response.json({ ok: true, avg, count: vals.length, mine: me ? ratings[me] ?? null : null });
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const stars = Number(body.stars ?? 0);
  if (!(stars >= 1 && stars <= 5)) return Response.json({ ok: false, error: "bad stars" }, { status: 400 });
  const email = emailOf(String(body.token ?? ""));
  if (!email) return Response.json({ ok: false, error: "auth required" }, { status: 401 });
  const ratings = load();
  ratings[email] = stars;
  save(ratings);
  const vals = Object.values(ratings);
  const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  return Response.json({ ok: true, avg, count: vals.length, mine: stars }, { status: 201 });
}
