import { list, put, del } from "@vercel/blob";

// Persistent JSON storage on Vercel Blob — survives deploys and cold starts.
//
// Vercel Blob's CDN serves stale content for overwritten pathnames (the cache
// key ignores query params), so fixed-path overwrites can't be read back fresh.
// Instead every write creates a NEW uniquely-named blob version, and reads list
// the versions and fetch the newest from its unique (never-cached) URL.

const onVercel = () => Boolean(process.env.BLOB_STORE_ID);

async function versionsOf(name: string) {
  const prefix = `data/${name}`;
  const res = await list({ prefix, limit: 50 });
  return res.blobs
    .filter((b) => b.pathname.startsWith(prefix) && b.pathname !== prefix)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

export async function loadJSON(name: string): Promise<unknown | null> {
  if (!onVercel()) return null;
  try {
    const versions = await versionsOf(name);
    if (!versions.length) return null;
    const res = await fetch(versions[0].url, { cache: "no-store" });
    if (!res.ok) return null;
    return JSON.parse(await res.text());
  } catch {
    return null;
  }
}

export async function saveJSON(name: string, data: unknown): Promise<void> {
  if (!onVercel()) return;
  try {
    await put(`data/${name}`, JSON.stringify(data), { access: "public" });
    // prune old versions, keep the newest 3 per file
    const old = (await versionsOf(name)).slice(3);
    if (old.length) await del(old.map((b) => b.url));
  } catch (e) {
    console.error("[blob] save failed for", name, String(e && (e as Error).message ? (e as Error).message : e));
  }
}
