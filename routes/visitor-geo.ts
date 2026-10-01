import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export const description = "Portfolio visitor map — city/country aggregation (no personal data)";

const FILE = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data", "visitor-geo.json");
const MAX_ENTRIES = 400;

type GeoEntry = { city: string; country: string; lat: number; lon: number; n: number };

const read = (): GeoEntry[] => {
  try {
    const d = JSON.parse(readFileSync(FILE, "utf-8"));
    return Array.isArray(d.geo) ? d.geo : [];
  } catch { return []; }
};

const write = (geo: GeoEntry[]) => {
  mkdirSync(join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify({ geo }, null, 1));
};

const header = (req: Request, name: string): string => {
  try { return decodeURIComponent(req.headers.get(name) || "").trim(); } catch { return ""; }
};

export function GET(): Response {
  return Response.json({ ok: true, geo: read() });
}

export async function POST(req: Request): Promise<Response> {
  const city = header(req, "x-vercel-ip-city") || "Unknown";
  const country = header(req, "x-vercel-ip-country") || "";
  const lat = parseFloat(header(req, "x-vercel-ip-latitude") || "NaN");
  const lon = parseFloat(header(req, "x-vercel-ip-longitude") || "NaN");
  if (!city && !country) return Response.json({ ok: true, geo: read() });
  const geo = read();
  const key = (city + "|" + country).toLowerCase();
  const found = geo.find((g) => (g.city + "|" + g.country).toLowerCase() === key);
  if (found) { found.n += 1; if (isFinite(lat) && isFinite(lon)) { found.lat = lat; found.lon = lon; } }
  else geo.push({ city, country, lat: isFinite(lat) ? lat : 0, lon: isFinite(lon) ? lon : 0, n: 1 });
  geo.sort((a, b) => b.n - a.n);
  if (geo.length > MAX_ENTRIES) geo.length = MAX_ENTRIES;
  write(geo);
  return Response.json({ ok: true, geo });
}
