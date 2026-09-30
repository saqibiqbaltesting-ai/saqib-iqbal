import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadAll, loadJSON, saveJSON } from "../routes/blob-store.js";
import * as auth from "../routes/auth.js";
import * as admin from "../routes/admin.js";
import * as chat from "../routes/chat.js";
import * as contact from "../routes/contact.js";
import * as galleryLock from "../routes/gallery-lock.js";
import * as guestbook from "../routes/guestbook.js";
import * as photoReactions from "../routes/photo-reactions.js";
import * as qa from "../routes/qa.js";
import * as quiz from "../routes/quiz.js";
import * as ratings from "../routes/ratings.js";
import * as visitors from "../routes/visitors.js";

const DATA_ROOT = process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data";
const DATA_DIR = join(DATA_ROOT, "data");
const SEED_DIR = join(process.cwd(), "data");

// On cold start: restore data files from Vercel Blob (persistent), falling back to repo seeds.
async function ensureData() {
  mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(SEED_DIR)) return;
  for (const name of readdirSync(SEED_DIR)) {
    const src = join(SEED_DIR, name);
    const dst = join(DATA_DIR, name);
    // only copy plain files — folders would crash copyFileSync (EISDIR)
    if (!existsSync(dst) && statSync(src).isFile()) {
      const remote = await loadJSON(name).catch(() => null);
      if (remote !== null && remote !== undefined) {
        try { writeFileSync(dst, JSON.stringify(remote)); } catch { copyFileSync(src, dst); }
      } else {
        copyFileSync(src, dst);
      }
    }
  }
}

// Before a POST that needs data: pull the latest blob versions over the
// (possibly stale) /tmp copies. One list call for all files.
async function syncFromBlob() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const files = await loadAll();
  for (const [name, data] of files) {
    try { writeFileSync(join(DATA_DIR, name), JSON.stringify(data)); } catch {}
  }
}

// Merge helper: union two users-db versions (local change wins per user).
// Sessions are gone (stateless tokens) — only the users list matters.
function mergeUsers(localData: any, remoteData: any): any {
  const lu: any[] = localData?.users || [];
  const ru: any[] = remoteData?.users || [];
  const lmap = new Map(lu.map((u) => [String(u.email).toLowerCase(), u]));
  const merged = [...ru.filter((u) => !lmap.has(String(u.email).toLowerCase())), ...lu];
  return { ...(remoteData || {}), ...localData, users: merged };
}

// After a POST: push data files back to Blob (merge users db to avoid lost updates).
async function persistData() {
  if (!existsSync(DATA_DIR)) return;
  for (const name of readdirSync(DATA_DIR)) {
    const src = join(DATA_DIR, name);
    if (!statSync(src).isFile()) continue;
    let payload: unknown;
    try { payload = JSON.parse(readFileSync(src, "utf-8")); } catch { continue; }
    if (name === "portfolio-users.json") {
      const remote = await loadJSON(name).catch(() => null);
      if (remote && typeof remote === "object") payload = mergeUsers(payload, remote);
    }
    await saveJSON(name, payload);
  }
}

const routes: Record<string, { GET?: (req: Request) => Response | Promise<Response>; POST?: (req: Request) => Response | Promise<Response> }> = {
  auth, admin, chat, contact, "gallery-lock": galleryLock, guestbook,
  "photo-reactions": photoReactions, qa, quiz, ratings, visitors,
};

async function handle(req: Request): Promise<Response> {
  await ensureData();
  const u = new URL(req.url, "http://localhost");
  // read the body once (Request.clone() is unreliable on Vercel's runtime)
  let bodyText: string | null = null;
  if (req.method === "POST") {
    try { bodyText = await req.text(); } catch { bodyText = null; }
  }
  let action = "";
  if (bodyText) { try { action = String(JSON.parse(bodyText)?.action ?? ""); } catch {} }
  if (req.method === "POST" && action !== "me" && action !== "logout") {
    // stateless actions need no data — skip the sync so /me stays instant
    // (the frontend boot aborts /me after 2.5s and shows the login gate)
    await syncFromBlob();
  }
  const callReq = bodyText !== null
    ? new Request(u.href, { method: "POST", headers: { "content-type": "application/json" }, body: bodyText })
    : req;
  const parts = u.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("x");
  const name = idx >= 0 ? parts[idx + 1] : parts[1];
  const route = routes[name];
  if (!route) return Response.json({ ok: false, error: "not found" }, { status: 404 });
  const fn = req.method === "GET" ? route.GET : req.method === "POST" ? route.POST : undefined;
  if (!fn) return Response.json({ ok: false, error: "method not allowed" }, { status: 405 });
  const res = await fn(callReq);
  if (req.method === "POST" && action !== "me" && action !== "logout") await persistData();
  return res;
}

export const GET = handle;
export const POST = handle;
