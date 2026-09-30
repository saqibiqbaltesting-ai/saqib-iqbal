import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readToken } from "./auth.js";

export const description = "Portfolio admin stats — owner only (token + email verified)";

const D = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data");
const OWNER = "fizanali6267@gmail.com";

const load = (f: string): any => {
  try { return JSON.parse(readFileSync(join(D, f), "utf-8")); } catch { return null; }
};

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const token = String(body?.token ?? "");
  const db = load("portfolio-users.json") || { users: [] };
  const claims = readToken(token);
  if (!claims || claims.email !== OWNER)
    return Response.json({ ok: false, error: "denied" }, { status: 403 });

  const vis = load("visitors.json") || { count: 0 };
  const gb = load("guestbook.json") || [];
  const pr = load("photo-reactions.json") || {};
  let reactions = 0;
  for (const k of Object.keys(pr)) {
    const v = (pr as any)[k];
    if (typeof v === "number") reactions += v;
    else if (v && typeof v === "object") reactions += Object.values(v).reduce((a: number, b: any) => a + (typeof b === "number" ? b : 0), 0);
  }

  return Response.json({
    ok: true,
    visitors: typeof vis.count === "number" ? vis.count : 0,
    users: (db.users || []).length,
    messages: gb.length,
    reactions,
    guestbook: (gb.length ? gb : []).slice(-20).reverse().map((m: any) => ({
      name: m.name, message: m.message, createdAt: m.createdAt,
    })),
  });
}
