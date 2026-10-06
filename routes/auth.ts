import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { loadJSON, saveJSON } from "./blob-store.js";
import { sendMail, approvalEmail, esc } from "./mailer.js";

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

// Owner-approval links. Reuses the same HMAC signing as session tokens but with
// a distinct context string and a 7-day TTL, so an approval link can never be
// replayed as a login token (or vice versa).
export function issueApprovalToken(email: string): string {
  if (!SECRET) throw new Error("AUTH_SECRET not configured");
  const body = Buffer.from(
    JSON.stringify({ email, ctx: APPROVAL_CONTEXT, exp: Date.now() + APPROVAL_TTL })
  ).toString("base64url");
  return `${body}.${sig(body)}`;
}
export function readApprovalToken(token: string): string | null {
  if (!SECRET) return null;
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return null;
  const expected = sig(parts[0]);
  if (parts[1].length !== expected.length || !timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expected)))
    return null;
  try {
    const p = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (p?.ctx !== APPROVAL_CONTEXT || typeof p.exp !== "number" || p.exp < Date.now()) return null;
    return typeof p.email === "string" ? p.email.toLowerCase() : null;
  } catch { return null; }
}
const isActive = (u: User) => (u.status ?? "active") === "active";

// Approve/deny by email — used by the email link (routes/approve.ts), which is a
// separate request from the normal dispatcher and therefore loads the store
// itself. Union-by-lowercased-email, exactly like api/[...path].ts does, so a
// stale read can never drop an account created in the meantime.
export async function decideByEmail(
  email: string,
  approve: boolean
): Promise<{ ok: boolean; error?: string }> {
  const target = String(email || "").trim().toLowerCase();
  if (!target) return { ok: false, error: "bad details" };
  const db = await load();
  const idx = db.users.findIndex((u) => u.email.toLowerCase() === target);
  if (idx === -1) return { ok: false, error: "not_found" };
  if (approve) {
    db.users[idx].status = "active";
    db.users[idx].approvedAt = Date.now();
  } else {
    db.users.splice(idx, 1);
  }
  await save(db);
  return { ok: true };
}

const OWNER = "fizanali6267@gmail.com";
// Accounts are approved by the owner, NOT by email verification. Resend's free
// tier cannot send to arbitrary addresses without a verified domain, so instead
// of "prove you own this inbox" we do "the owner says yes" — which is stronger
// anyway: nobody gets in without Saqib allowing it. New signups are created with
// status "pending"; only "active" accounts can log in.
const SITE_URL = (process.env.SITE_URL || "https://saqib-iqbal.vercel.app").replace(/\/+$/, "");
const APPROVAL_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days
const APPROVAL_CONTEXT = "account-approval";

// Persistent user storage via the GitHub-backed data store (same backend as
// guestbook etc.). The old /tmp file died with every serverless instance,
// which made "signup works, immediate login says account not found".
const FILE_NAME = "portfolio-users.json";
type LoginRec = { ts: number; ip?: string; ua?: string };
type Status = "pending" | "active";
type User = { name: string; email: string; salt: string; hash: string; lastLogins?: LoginRec[]; joined?: number; status?: Status; approvedAt?: number };
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
    const existing = db.users.find((u) => u.email === email);
    if (existing)
      return Response.json(
        { ok: false, error: "exists", status: existing.status ?? "active" },
        { status: 400 }
      );
    const rl = rateLimit(req, db, "signup", 6, 60 * 60 * 1000);
    if (!rl.ok) return Response.json({ ok: false, error: "slow down" }, { status: 429 });
    const salt = randomBytes(16).toString("hex");
    const isOwner = email === OWNER;
    db.users.push({
      name, email, salt, hash: hashPw(password, salt), lastLogins: [], joined: Date.now(),
      status: isOwner ? "active" : "pending",
      ...(isOwner ? { approvedAt: Date.now() } : {}),
    });
    await save(db);

    // Owner's own account skips approval, otherwise tell the owner.
    let mailed = false;
    let mailError: string | undefined;
    if (!isOwner) {
      const mail = approvalEmail({
        siteUrl: SITE_URL,
        token: issueApprovalToken(email),
        name,
        email,
        when: new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi" }) + " (PKT)",
      });
      const r = await sendMail({ to: OWNER, ...mail });
      mailed = r.sent;
      mailError = r.error;
    }
    return ok({
      pending: !isOwner,
      mailed,
      ...(mailError ? { mailError } : {}),
      ...(isOwner ? { token: issueToken(email, name), user: { name, email } } : {}),
    });
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
    // Owner approval gate: a correct password on an unapproved account must NOT
    // issue a session. Checked AFTER the password so it never leaks which emails
    // exist to someone guessing.
    if (!isActive(user))
      return Response.json(
        { ok: false, error: "pending_approval", name: user.name },
        { status: 403 }
      );
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
      status: user ? (user.status ?? "active") : null,
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

  if (action === "resend-approval") {
    const email = String(body?.email ?? "").trim().toLowerCase();
    const rl = rateLimit(req, db, "resend-approval", 3, 60 * 60 * 1000);
    if (!rl.ok) return Response.json({ ok: false, error: "slow down" }, { status: 429 });
    const user = db.users.find((u) => u.email === email);
    if (!user || isActive(user))
      return Response.json({ ok: false, error: "bad details" }, { status: 400 });
    const mail = approvalEmail({
      siteUrl: SITE_URL,
      token: issueApprovalToken(email),
      name: user.name,
      email,
      when: new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi" }) + " (PKT)",
    });
    const r = await sendMail({ to: OWNER, ...mail });
    return ok({ mailed: r.sent, ...(r.error ? { mailError: r.error } : {}) });
  }

  // Owner-only: who is waiting on approval?
  if (action === "pending-list") {
    const p = readToken(String(body?.token ?? ""));
    if (!p || p.email.toLowerCase() !== OWNER.toLowerCase())
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const pending = db.users
      .filter((u) => !isActive(u))
      .map((u) => ({ name: u.name, email: u.email, joined: u.joined ?? null }))
      .sort((a, b) => (b.joined ?? 0) - (a.joined ?? 0));
    return ok({ pending });
  }

  // Owner-only: approve or deny a pending account directly from the site.
  if (action === "decide") {
    const p = readToken(String(body?.token ?? ""));
    if (!p || p.email.toLowerCase() !== OWNER.toLowerCase())
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const email = String(body?.email ?? "").trim().toLowerCase();
    const approve = body?.approve !== false;
    const idx = db.users.findIndex((u) => u.email === email);
    if (idx === -1) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    if (approve) {
      db.users[idx].status = "active";
      db.users[idx].approvedAt = Date.now();
    } else {
      db.users.splice(idx, 1);
    }
    await save(db);
    return ok({ approved: approve });
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
