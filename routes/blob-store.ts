import { get, put } from "@vercel/blob";

// Persistent JSON storage on Vercel Blob — survives deploys and cold starts.
// Falls back to no-op when BLOB_READ_WRITE_TOKEN is absent (local dev uses /tmp seeds).

export async function loadJSON(name: string): Promise<unknown | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    const res = await get(`data/${name}`, { token, access: "public" });
    if (!res || res.statusCode !== 200) return null;
    return JSON.parse(await new Response(res.stream).text());
  } catch {
    return null;
  }
}

export async function saveJSON(name: string, data: unknown): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;
  try {
    await put(`data/${name}`, JSON.stringify(data), {
      token,
      access: "public",
      addRandomSuffix: false,
    });
  } catch {
    // non-fatal: next request will retry the sync
  }
}
