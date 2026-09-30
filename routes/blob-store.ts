// Persistent JSON storage — GitHub private repo backend.
//
// Why: the Vercel Blob stores hit the free-tier limit and got suspended
// ("limits-exceeded-suspended"), so every write silently failed and accounts
// vanished on each deploy. This backend stores each data file as
// data/<name>.json in the private repo GITHUB_DATA_REPO using the
// GitHub Contents API with GITHUB_DATA_TOKEN.
//
// Same exported interface as the old blob store (loadAll / loadJSON / saveJSON),
// so nothing else in the app changes.

const REPO = process.env.GITHUB_DATA_REPO || "saqibiqbaltesting-ai/saqib-data";
const TOKEN = process.env.GITHUB_DATA_TOKEN || "";
const API = "https://api.github.com";

const active = () => Boolean(TOKEN);

// sha cache saves one GET per file per write (invalidated on conflicts)
const shaCache = new Map<string, string>();

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "saqib-portfolio",
  };
}

async function ghGet(path: string): Promise<{ sha: string | null; json: unknown | null }> {
  const r = await fetch(`${API}/repos/${REPO}/contents/${path}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!r.ok) return { sha: null, json: null };
  const j: any = await r.json();
  try {
    return { sha: j.sha, json: JSON.parse(Buffer.from(j.content, "base64").toString("utf8")) };
  } catch {
    return { sha: j.sha, json: null };
  }
}

async function ghPut(path: string, data: unknown, sha: string | null): Promise<boolean> {
  const body: Record<string, unknown> = {
    message: `data sync: ${path}`,
    content: Buffer.from(JSON.stringify(data)).toString("base64"),
  };
  if (sha) body.sha = sha;
  const r = await fetch(`${API}/repos/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (r.ok) {
    try { shaCache.set(path, ((await r.json()) as any).content.sha); } catch {}
    return true;
  }
  // conflict or stale sha: refetch and retry once
  if (r.status === 409 || r.status === 422 || r.status === 404) {
    const fresh = await ghGet(path);
    const body2: Record<string, unknown> = {
      message: `data sync (retry): ${path}`,
      content: Buffer.from(JSON.stringify(data)).toString("base64"),
      sha: fresh.sha,
    };
    const r2 = await fetch(`${API}/repos/${REPO}/contents/${path}`, {
      method: "PUT",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify(body2),
    });
    if (r2.ok) {
      try { shaCache.set(path, ((await r2.json()) as any).content.sha); } catch {}
      return true;
    }
  }
  return false;
}

async function listDataFiles(): Promise<string[]> {
  const r = await fetch(`${API}/repos/${REPO}/contents/data`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!r.ok) return [];
  const j: any = await r.json();
  return Array.isArray(j) ? j.filter((f: any) => f.type === "file").map((f: any) => String(f.name)) : [];
}

// One sweep for ALL data files (used before POSTs that need data).
export async function loadAll(): Promise<Map<string, unknown>> {
  const out = new Map<string, unknown>();
  if (!active()) return out;
  const names = await listDataFiles();
  await Promise.all(
    names.map(async (name) => {
      const v = await loadJSON(name);
      if (v !== null && v !== undefined) out.set(name, v);
    })
  );
  return out;
}

export async function loadJSON(name: string): Promise<unknown | null> {
  if (!active()) return null;
  try {
    const { json } = await ghGet(`data/${name}`);
    return json;
  } catch {
    return null;
  }
}

export async function saveJSON(name: string, data: unknown): Promise<void> {
  if (!active()) return;
  try {
    const path = `data/${name}`;
    let sha = shaCache.get(path) ?? null;
    if (!sha) sha = (await ghGet(path)).sha;
    const okWrite = await ghPut(path, data, sha);
    if (!okWrite) console.error("[data-store] save failed for", name);
  } catch (e) {
    console.error("[data-store] save failed for", name, e instanceof Error ? e.message : e);
  }
}
