import { put } from "@vercel/blob";

// Persistent JSON storage on Vercel Blob — survives deploys and cold starts.
// Writes go through the SDK (OIDC auth inside Vercel functions).
// Reads bypass the CDN cache with a cache-buster, so fresh writes are visible instantly.
const onVercel = () => Boolean(process.env.BLOB_STORE_ID);

export async function loadJSON(name: string): Promise<unknown | null> {
  if (!onVercel()) return null;
  try {
    const host = `${process.env.BLOB_STORE_ID!.replace(/^store_/, "")}.public.blob.vercel-storage.com`;
    const res = await fetch(`https://${host}/data/${name}?cb=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    return JSON.parse(await res.text());
  } catch {
    return null;
  }
}

export async function saveJSON(name: string, data: unknown): Promise<void> {
  if (!onVercel()) return;
  try {
    await put(`data/${name}`, JSON.stringify(data), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (e) {
    console.error("[blob] save failed for", name, String(e && (e as Error).message ? (e as Error).message : e));
  }
}
