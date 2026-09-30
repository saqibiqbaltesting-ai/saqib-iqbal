import { loadJSON, saveJSON } from "./blob-store.js";

export const description = "temp storage diagnostics";

export async function GET(req: Request): Promise<Response> {
  const u = new URL(req.url, "http://localhost");
  const step = u.searchParams.get("step") || "read";
  const storeId = process.env.BLOB_STORE_ID || null;

  if (step === "write") {
    const db: any = await loadJSON("portfolio-users.json");
    const before = db ? db.users.length : "null";
    if (db) db.users.push({ name: "Marker", email: `marker-${Date.now()}@kit.test`, salt: "x", hash: "x" });
    if (db) await saveJSON("portfolio-users.json", db);
    const after: any = await loadJSON("portfolio-users.json");
    return Response.json({ storeId, before, afterUsers: after ? after.users.length : null, emails: after ? after.users.map((x: any) => x.email) : null });
  }

  const db: any = await loadJSON("portfolio-users.json");
  return Response.json({ storeId, users: db ? db.users.map((x: any) => x.email) : null });
}
