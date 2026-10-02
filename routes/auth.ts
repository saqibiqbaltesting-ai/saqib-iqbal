import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

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

const FILE = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data", "portfolio-users.json");

type LoginRec = { ts: number; ip?: string; ua?: string };
type User = { name: string; email: string; salt: string; hash: string; lastLogins?: LoginRec[]; joined?: number };
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
    db.users.push({ name, email, salt, hash: hashPw(password, salt), lastLogins: [], joined: Date.now() });
    const token = issueToken(email, name);
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
    // login history — latest 10 (device management / session info)
    if (!Array.isArray(user.lastLogins)) user.lastLogins = [];
    user.lastLogins.unshift({
      ts: Date.now(),
      ip: String(req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim(),
      ua: String(req.headers.get("user-agent") ?? "").slice(0, 120),
    });
    user.lastLogins = user.lastLogins.slice(0, 10);
    save(db);
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
    const idx = db.users.findIndex((u) => u.email === email);
    if (idx === -1) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    const user = db.users[idx];
    if (email === OWNER) return Response.json({ ok: false, error: "owner_protected" }, { status: 403 });
    if (user.hash !== hashPw(password, user.salt))
      return Response.json({ ok: false, error: "bad credentials" }, { status: 401 });
    db.users.splice(idx, 1);
    save(db);
    return ok();
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
    if (email === OWNER) return Response.json({ ok: false, error: "owner_protected" }, { status: 403 });
    const user = db.users.find((u) => u.email === email);
    if (!user) return Response.json({ ok: false, error: "not found" }, { status: 404 });
    user.salt = randomBytes(16).toString("hex");
    user.hash = hashPw(newPassword, user.salt);
    save(db);
    return ok();
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
