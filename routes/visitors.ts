import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export const description = "Portfolio visitor counter";

const FILE = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data", "visitors.json");

const read = (): number => {
  try { return JSON.parse(readFileSync(FILE, "utf-8")).count ?? 0; } catch { return 0; }
};
const write = (count: number) => {
  mkdirSync(join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify({ count }));
};

export function GET(): Response {
  return Response.json({ count: read() });
}

export async function POST(): Promise<Response> {
  const count = read() + 1;
  write(count);
  return Response.json({ count });
}
