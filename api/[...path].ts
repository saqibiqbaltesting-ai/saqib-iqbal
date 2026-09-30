import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadJSON, saveJSON } from "../routes/blob-store.js";
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

// Restore data files from Vercel Blob (persistent) or repo seeds (fallback).
// Route handlers keep reading/writing plain files, so no route changes needed.
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

// Push the current data files back to Blob so they survive restarts/deploys.
async function persistData() {
  if (!existsSync(DATA_DIR)) return;
  for (const name of readdirSync(DATA_DIR)) {
    const src = join(DATA_DIR, name);
    if (!statSync(src).isFile()) continue;
    try { await saveJSON(name, JSON.parse(readFileSync(src, "utf-8"))); } catch {}
  }
}

const routes: Record<string, { GET?: (req: Request) => Response | Promise<Response>; POST?: (req: Request) => Response | Promise<Response> }> = {
  auth, admin, chat, contact, "gallery-lock": galleryLock, guestbook,
  "photo-reactions": photoReactions, qa, quiz, ratings, visitors,
};

async function handle(req: Request): Promise<Response> {
  await ensureData();
  const u = new URL(req.url, "http://localhost");
  const parts = u.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("x");
  const name = idx >= 0 ? parts[idx + 1] : parts[1];
  const route = routes[name];
  if (!route) return Response.json({ ok: false, error: "not found" }, { status: 404 });
  const fn = req.method === "GET" ? route.GET : req.method === "POST" ? route.POST : undefined;
  if (!fn) return Response.json({ ok: false, error: "method not allowed" }, { status: 405 });
  const res = await fn(req);
  if (req.method === "POST") await persistData();
  return res;
}

export const GET = handle;
export const POST = handle;
