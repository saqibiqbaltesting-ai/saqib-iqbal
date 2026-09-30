import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash, randomBytes } from "node:crypto";

export const description = "Portfolio auth — email signup/login with token sessions";

const FILE = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data", "portfolio-users.json");

type User = { name: string; email: string; salt: string; hash: string };
type Session = { token: string; email: string; createdAt: string };

const load = (): { users: User[]; sessions: Session[] } => {
  try { return JSON.parse(readFileSync(FILE, "utf-8")); } catch { return { users: [], sessions: [] }; }
};
const save = (db: { users: User[]; sessions: Session[] }) => {
  mkdirSync(join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(db, null, 2));
};

const hashPw = (pw: string, salt: string) =>
  createHash("sha256").update(`${salt}:${pw}`).digest("hex");

const ok = (extra: Record<string, unknown> = {}) => Response.json({ ok: true, ...extra });

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "");
  const db = load();

  if (action === "signup") {
    const name = String(body?.name ?? "").trim().slice(0, 60);
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6)
      return Response.json({ ok: false, error: "bad details" }, { status: 400 });
    if (db.users.some((u) => u.email === email))
      return Response.json({ ok: false, error: "exists" }, { status: 400 });
    const salt = randomBytes(16).toString("hex");
    db.users.push({ name, email, salt, hash: hashPw(password, salt) });
    const token = randomBytes(24).toString("hex");
    db.sessions.push({ token, email, createdAt: new Date().toISOString() });
    save(db);
    return ok({ token, user: { name, email } });
  }

  if (action === "login") {
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const user = db.users.find((u) => u.email === email);
    if (!user)
      return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    if (user.hash !== hashPw(password, user.salt))
      return Response.json({ ok: false, error: "bad credentials" }, { status: 401 });
    const token = randomBytes(24).toString("hex");
    db.sessions.push({ token, email, createdAt: new Date().toISOString() });
    save(db);
    return ok({ token, user: { name: user.name, email: user.email } });
  }

  if (action === "forgot") {
    const email = String(body?.email ?? "").trim().toLowerCase();
    const newPassword = String(body?.password ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || newPassword.length < 6)
      return Response.json({ ok: false, error: "bad details" }, { status: 400 });
    // simple per-IP rate limit: 10 resets/hour
    const ip = req.headers.get("x-forwarded-for") || "local";
    const now = Date.now();
    const rl = (db as any)._rl || ((db as any)._rl = {} as Record<string, number[]>);
    rl[ip] = (rl[ip] || []).filter((t: number) => now - t < 3600000);
    if (rl[ip].length >= 10) return Response.json({ ok: false, error: "slow down" }, { status: 429 });
    rl[ip].push(now);
    const user = db.users.find((u) => u.email === email);
    if (!user) return Response.json({ ok: false, error: "not found" }, { status: 404 });
    user.salt = randomBytes(16).toString("hex");
    user.hash = hashPw(newPassword, user.salt);
    // force re-login everywhere for this account
    db.sessions = db.sessions.filter((s) => s.email !== email);
    save(db);
    return ok();
  }

  if (action === "me") {
    const token = String(body?.token ?? "");
    const session = db.sessions.find((s) => s.token === token);
    if (!session) return Response.json({ ok: false }, { status: 401 });
    const user = db.users.find((u) => u.email === session.email);
    return ok({ user: user ? { name: user.name, email: user.email } : null });
  }

  if (action === "logout") {
    const token = String(body?.token ?? "");
    db.sessions = db.sessions.filter((s) => s.token !== token);
    save(db);
    return ok();
  }

  return Response.json({ ok: false, error: "unknown action" }, { status: 400 });
}
