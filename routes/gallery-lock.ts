import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { readToken } from "./auth.js";

export const description = "Gallery password lock";

const FILE = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data", "gallery-lock.json");

const getPass = (): string => {
  try {
    return String(JSON.parse(readFileSync(FILE, "utf-8")).pass ?? "");
  } catch {
    return "Love";
  }
};

const setPass = (pass: string) => {
  mkdirSync(join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify({ pass }));
};

// brute-force guard state (see POST below)
const galleryHits = new Map<string, number[]>();

export async function POST(req: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }
  // optional: owner can change the password (token se verify)
  if (body.action === "set" && body.newpass) {
    const claims = readToken(String(body.token ?? ""));
    if (!claims || claims.email.toLowerCase() !== "fizanali6267@gmail.com") {
      return Response.json({ ok: false, error: "denied" }, { status: 403 });
    }
    const np = String(body.newpass);
    if (np.length < 3 || np.length > 40) {
      return Response.json({ ok: false, error: "bad pass" }, { status: 400 });
    }
    setPass(np);
    return Response.json({ ok: true, changed: true });
  }
  const pass = String(body.pass ?? "");
  if (pass) {
    // brute-force guard: 10 attempts per IP per 5 minutes (in-memory, per instance)
    const ip = String(req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
    const now = Date.now();
    const arr = ((galleryHits.get(ip) ?? []) as number[]).filter((t) => now - t < 5 * 60 * 1000);
    if (arr.length >= 10) { galleryHits.set(ip, arr); return Response.json({ ok: false, error: "slow down" }, { status: 429 }); }
    if (pass === getPass()) {
      galleryHits.delete(ip);
      return Response.json({ ok: true });
    }
    arr.push(now);
    galleryHits.set(ip, arr);
    if (galleryHits.size > 500) galleryHits.clear();
  }
  return Response.json({ ok: false, error: "wrong" }, { status: 401 });
}

