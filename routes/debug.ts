import { list } from "@vercel/blob";
import { loadJSON, saveJSON } from "./blob-store.js";

export const description = "temp storage diagnostics";

export async function GET(): Promise<Response> {
  const out: Record<string, unknown> = {};
  try {
    const marker = `marker-${Date.now()}`;
    const db: any = (await loadJSON("portfolio-users.json")) || { users: [] };
    out.usersBefore = db.users.length;
    db.users.push({ name: "Marker", email: `${marker}@kit.test`, salt: "x", hash: "x" });
    await saveJSON("portfolio-users.json", db);
    const after: any = await loadJSON("portfolio-users.json");
    out.usersAfter = after ? after.users.length : null;
    out.readAfterWriteFresh = after ? after.users.some((x: any) => x.email === `${marker}@kit.test`) : false;
    const res = await list({ limit: 100 });
    out.count = res.blobs.length;
    out.paths = res.blobs.map((b) => b.pathname).slice(0, 30);
  } catch (e: any) {
    out.error = String(e?.message || e);
  }
  return Response.json(out);
}
