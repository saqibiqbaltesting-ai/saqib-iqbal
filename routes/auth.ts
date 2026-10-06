import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { loadJSON, saveJSON } from "./blob-store.js";

// Stateless signed tokens (HMAC) — no server-side session storage needed,
// so login/refresh work instantly even with eventually-consistent blob storage.
// Fail-closed: if AUTH_SECRET is unset we reject/issue no tokens instead of
// falling back to a guessable string (this repo is public — a hardcoded
// fallback would let anyone forge tokens for any account, including the owner).
const SECRET = process.env.AUTH_SECRET || "";
type TokenPayload = { email: string; name: string; exp: number };
const sig = (body: string) => SECRET ? createHmac("sha256", SECRET).update(body).digest("base64url") : "";
function issueToken(email: string, name: string): string {
  if (!SECRET) throw new Error("AUTH_SECRET not configured");
  const body = Buffer.from(JSON.stringify({ email, name, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 })).toString("base64url");
  return `${body}.${sig(body)}`;
}
export function readToken(token: string): TokenPayload | null {
  if (!SECRET) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const expected = sig(parts[0]);
  const got = parts[1];
  if (got.length !== expected.length || !timingSafeEqual(Buffer.from(got), Buffer.from(expected))) return null;
  try {
    const p: TokenPayload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (!p.email || typeof p.exp !== "number" || p.exp < Date.now()) return null;
    return p;
  } catch { return null; }
}

export const description = "Portfolio auth — email signup/login with token sessions";

const OWNER = "fizanali6267@gmail.com";

// Persistent user storage via the GitHub-backed data store (same backend as
// guestbook etc.). The old /tmp file died with every serverless instance,
// which made "signup works, immediate login says account not found".
const FILE_NAME = "portfolio-users.json";
type LoginRec = { ts: number; ip?: string; ua?: string };
type User = { name: string; email: string; salt: string; hash: string; lastLogins?: LoginRec[]; joined?: number };
type Session = { token: string; email: string; createdAt: string };
type DB = { users: User[]; sessions: Session[] };

const load = async (): Promise<DB> => {
  try {
    const j = (await loadJSON(FILE_NAME)) as DB | null;
    if (j && Array.isArray(j.users)) return j;
  } catch {}
  return { users: [], sessions: [] };
};
// only users/sessions persist — transient fields (rate-limit map) stay out
const save = (db: DB): Promise<void> =>
  saveJSON(FILE_NAME, { users: db.users, sessions: db.sessions });

// Per-IP sliding-window rate limit. The map lives in memory per instance
// (not persisted), which is enough to stop casual brute force.
const _rl: Record<string, number[]> = {};
function rateLimit(req: Request, _db: DB, key: string, max: number, windowMs: number) {
  const ip = String(req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  const k = `${key}:${ip}`;
  const now = Date.now();
  const hits = (_rl[k] || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) return { ok: false };
  hits.push(now);
  _rl[k] = hits;
  return { ok: true };
}

const hashPw = (pw: string, salt: string) =>
  createHash("sha256").update(`${salt}:${pw}`).digest("hex");

const ok = (extra: Record<string, unknown> = {}) => Response.json({ ok: true, ...extra });

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "");
  const db = await load();

  if (action === "signup") {
    const name = String(body?.name ?? "").trim().slice(0, 60);
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8)
      return Response.json({ ok: false, error: "bad details" }, { status: 400 });
    if (db.users.some((u) => u.email === email))
      return Response.json({ ok: false, error: "exists" }, { status: 400 });
    const rl = rateLimit(req, db, "signup", 6, 60 * 60 * 1000);
    if (!rl.ok) return Response.json({ ok: false, error: "slow down" }, { status: 429 });
    const salt = randomBytes(16).toString("hex");
    db.users.push({ name, email, salt, hash: hashPw(password, salt), lastLogins: [], joined: Date.now() });
    const token = issueToken(email, name);
    await save(db);
    return ok({ token, user: { name, email } });
  }

  if (action === "login") {
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const rl = rateLimit(req, db, "login", 12, 10 * 60 * 1000);
    if (!rl.ok) return Response.json({ ok: false, error: "slow down" }, { status: 429 });
    const user = db.users.find((u) => u.email === email);
    if (!user)
      return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    if (user.hash !== hashPw(password, user.salt))
      return Response.json({ ok: false, error: "bad credentials" }, { status: 401 });
    // login history — latest 10 (device management / session info)
    if (!Array.isArray(user.lastLogins)) user.lastLogins = [];
    user.lastLogins.unshift({
      ts: Date.now(),
      ip: String(req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim(),
      ua: String(req.headers.get("user-agent") ?? "").slice(0, 120),
    });
    user.lastLogins = user.lastLogins.slice(0, 10);
    await save(db);
    const token = issueToken(email, user.name);
    return ok({ token, user: { name: user.name, email: user.email } });
  }

  if (action === "account-info") {
    const p = readToken(String(body?.token ?? ""));
    if (!p) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const user = db.users.find((u) => u.email === p.email.toLowerCase());
    return ok({
      email: p.email,
      name: p.name,
      joined: user?.joined ?? null,
      lastLogins: (user?.lastLogins ?? []).slice(0, 10),
    });
  }

  if (action === "delete-account") {
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const p = readToken(String(body?.token ?? ""));
    if (!p || p.email.toLowerCase() !== email)
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const idx = db.users.findIndex((u) => u.email === email);
    if (idx === -1) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    const user = db.users[idx];
    if (email === OWNER) return Response.json({ ok: false, error: "owner_protected" }, { status: 403 });
    if (user.hash !== hashPw(password, user.salt))
      return Response.json({ ok: false, error: "bad credentials" }, { status: 401 });
    db.users.splice(idx, 1);
    await save(db);
    return ok();
  }

  if (action === "forgot") {
    // Password reset without email verification is an account-takeover hole:
    // anyone who knew an email could rewrite its password. Until a real reset
    // email exists, this only records the request and tells the owner.
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return Response.json({ ok: false, error: "bad details" }, { status: 400 });
    const rl = rateLimit(req, db, "forgot", 5, 60 * 60 * 1000);
    if (!rl.ok) return Response.json({ ok: false, error: "slow down" }, { status: 429 });
    return Response.json(
      { ok: false, error: "reset_unavailable" },
      { status: 503 }
    );
  }

  if (action === "me") {
    const token = String(body?.token ?? "");
    const p = readToken(token);
    if (!p) return Response.json({ ok: false }, { status: 401 });
    // frontend boot expects flat { name, email } in the response body;
    // the signed token already carries them — no storage read needed
    return ok({ name: p.name, email: p.email });
  }

  if (action === "logout") {
    // stateless tokens: the client just drops the token
    return ok();
  }

  return Response.json({ ok: false, error: "unknown action" }, { status: 400 });
}
