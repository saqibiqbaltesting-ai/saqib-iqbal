import { list } from "@vercel/blob";

export const description = "temp storage diagnostics";

export async function GET(): Promise<Response> {
  const res = await list({ limit: 100 });
  return Response.json({ count: res.blobs.length, paths: res.blobs.map((b) => b.pathname).slice(0, 25) });
}
