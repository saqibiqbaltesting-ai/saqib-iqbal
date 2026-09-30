import { list, put, del } from "@vercel/blob";

// Persistent JSON storage on Vercel Blob — survives deploys and cold starts.
//
// Vercel Blob limitations this design works around:
// 1. Overwriting a fixed pathname serves STALE cached content on reads.
// 2. The SDK inserts its random suffix before the FIRST dot in the path,
//    so version paths must contain no dots.
// 3. list() is fresh enough to discover the latest version right after a write.
//
// Each logical file gets a dot-free version folder: data/v-<key>/blob-<rand>.

const onVercel = () => Boolean(process.env.BLOB_STORE_ID);

const key = (name: string) => name.replace(/[^a-zA-Z0-9-]/g, "_");
const versionPrefix = (name: string) => `data/v-${key(name)}/`;

async function versionsOf(name: string) {
  const res = await list({ prefix: versionPrefix(name), limit: 50 });
  return res.blobs
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
    await put(`${versionPrefix(name)}blob`, JSON.stringify(data), {
      access: "public",
      addRandomSuffix: true,
    });
    // prune old versions, keep the newest 3
    const old = (await versionsOf(name)).slice(3);
    if (old.length) await del(old.map((b) => b.url));
  } catch (e) {
    console.error("[blob] save failed for", name, String(e && (e as Error).message ? (e as Error).message : e));
  }
}
