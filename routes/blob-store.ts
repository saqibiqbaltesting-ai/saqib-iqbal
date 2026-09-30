import { get, put } from "@vercel/blob";

// Persistent JSON storage on Vercel Blob — survives deploys and cold starts.
// Uses OIDC auth inside Vercel functions (BLOB_STORE_ID env), no-op locally.
const onVercel = () => Boolean(process.env.BLOB_STORE_ID);

export async function loadJSON(name: string): Promise<unknown | null> {
  if (!onVercel()) return null;
  try {
    const res = await get(`data/${name}`, { access: "public" });
    if (!res || res.statusCode !== 200) return null;
    return JSON.parse(await new Response(res.stream).text());
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
