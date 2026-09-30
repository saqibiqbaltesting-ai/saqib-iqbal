import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export const description = "Visitor Q&A — public asks, owner answers";

const DIR = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data");
const FILE = join(DIR, "qa.json");
const OWNER = "fizanali6267@gmail.com";

type QA = { id: string; name: string; question: string; answer: string; ts: number };

const load = (): QA[] => {
  try {
    const d = JSON.parse(readFileSync(FILE, "utf-8"));
    return Array.isArray(d.qa) ? d.qa : [];
  } catch {
    return [];
  }
};

const save = (qa: QA[]) => {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify({ qa }));
};

// token → email (sessions from portfolio-users.json)
function tokenEmail(token: string): string | null {
  if (!token) return null;
  try {
    const db = JSON.parse(readFileSync(join(DIR, "portfolio-users.json"), "utf-8"));
    const s = (db.sessions ?? []).find(
      (x: Record<string, unknown>) => String(x.token ?? x.id ?? "") === token
    );
    return s ? String(s.email ?? "") : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const email = tokenEmail(String(url.searchParams.get("token") ?? ""));
  const qa = load();
  const answered = qa
    .filter((x) => x.answer)
    .map(({ id, name, question, answer, ts }) => ({ id, name, question, answer, ts }));
  if (email === OWNER) {
    const pending = qa
      .filter((x) => !x.answer)
      .map(({ id, name, question, ts }) => ({ id, name, question, ts }));
    return Response.json({ ok: true, qa: answered, pending, owner: true });
  }
  return Response.json({ ok: true, qa: answered, pending: [], owner: false });
}

export async function POST(req: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }
  const qa = load();

  if (body.action === "answer") {
    const email = tokenEmail(String(body.token ?? ""));
    if (email !== OWNER) return Response.json({ ok: false, error: "denied" }, { status: 403 });
    const id = String(body.id ?? "");
    const answer = String(body.answer ?? "").trim().slice(0, 1000);
    const item = qa.find((x) => x.id === id);
    if (!item) return Response.json({ ok: false, error: "not found" }, { status: 404 });
    item.answer = answer;
    save(qa);
    return Response.json({ ok: true });
  }

  // ask
  const name = String(body.name ?? "").trim().slice(0, 24) || "Mehman";
  const question = String(body.question ?? "").trim().slice(0, 300);
  if (!question) return Response.json({ ok: false, error: "no question" }, { status: 400 });
  qa.push({
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    name,
    question,
    answer: "",
    ts: Date.now(),
  });
  save(qa.slice(-200));
  return Response.json({ ok: true }, { status: 201 });
}
