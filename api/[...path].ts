import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import * as auth from "../routes/auth";
import * as admin from "../routes/admin";
import * as chat from "../routes/chat";
import * as contact from "../routes/contact";
import * as galleryLock from "../routes/gallery-lock";
import * as guestbook from "../routes/guestbook";
import * as photoReactions from "../routes/photo-reactions";
import * as qa from "../routes/qa";
import * as quiz from "../routes/quiz";
import * as ratings from "../routes/ratings";
import * as visitors from "../routes/visitors";

const DATA_ROOT = process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data";
const DATA_DIR = join(DATA_ROOT, "data");
const SEED_DIR = join(process.cwd(), "data");

function ensureData() {
  mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(SEED_DIR)) return;
  for (const name of readdirSync(SEED_DIR)) {
    const src = join(SEED_DIR, name);
    const dst = join(DATA_DIR, name);
    // only copy plain files — folders would crash copyFileSync (EISDIR)
    if (!existsSync(dst) && statSync(src).isFile()) copyFileSync(src, dst);
  }
}

const routes: Record<string, { GET?: (req: Request) => Response | Promise<Response>; POST?: (req: Request) => Response | Promise<Response> }> = {
  auth, admin, chat, contact, "gallery-lock": galleryLock, guestbook,
  "photo-reactions": photoReactions, qa, quiz, ratings, visitors,
};

export default async function handler(req: Request): Promise<Response> {
  ensureData();
  const u = new URL(req.url);
  const parts = u.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("x");
  const name = idx >= 0 ? parts[idx + 1] : parts[1];
  const route = routes[name];
  if (!route) return Response.json({ ok: false, error: "not found" }, { status: 404 });
  const fn = req.method === "GET" ? route.GET : req.method === "POST" ? route.POST : undefined;
  if (!fn) return Response.json({ ok: false, error: "method not allowed" }, { status: 405 });
  return fn(req);
}
