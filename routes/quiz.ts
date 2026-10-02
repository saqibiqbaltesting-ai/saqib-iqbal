import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { readToken } from "./auth.js";

export const description = "Saqib quiz — questions + leaderboard (answers stay server-side)";

const DIR = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data");
const QFILE = join(DIR, "quiz.json");
const SFILE = join(DIR, "quiz-scores.json");

type Q = { q: string; options: string[]; a: number };

const loadQs = (): Q[] => {
  try {
    const d = JSON.parse(readFileSync(QFILE, "utf-8"));
    return Array.isArray(d.questions) ? d.questions : [];
  } catch {
    return [];
  }
};

type Score = { name: string; score: number; total: number; ts: number };

const loadScores = (): Score[] => {
  try {
    const d = JSON.parse(readFileSync(SFILE, "utf-8"));
    return Array.isArray(d.scores) ? d.scores : [];
  } catch {
    return [];
  }
};

const saveScores = (s: Score[]) => {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(SFILE, JSON.stringify({ scores: s }));
};

const top = (n = 10): Score[] =>
  loadScores()
    .sort((a, b) => b.score - a.score || a.ts - b.ts)
    .slice(0, n);

export async function GET(): Promise<Response> {
  const qs = loadQs();
  return Response.json({
    ok: true,
    questions: qs.map((q) => ({ q: q.q, options: q.options })),
    leaderboard: top(),
  });
}

export async function POST(req: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }
  const qs = loadQs();
  if (!qs.length) return Response.json({ ok: false, error: "no questions" }, { status: 500 });
  const answers = Array.isArray(body.answers) ? body.answers.map((x) => Number(x)) : [];
  if (!answers.length) return Response.json({ ok: false, error: "no answers" }, { status: 400 });

  let score = 0;
  qs.forEach((q, i) => {
    if (answers[i] === q.a) score++;
  });

  // naam: logged-in user ka SERVER-VERIFIED naam, warna body ka naam
  let name = String(body.name ?? "").trim().slice(0, 24);
  const claims = readToken(String(body.token ?? ""));
  if (claims) {
    try {
      const db = JSON.parse(readFileSync(join(DIR, "portfolio-users.json"), "utf-8"));
      const u = (db.users ?? []).find(
        (x: Record<string, unknown>) => String(x.email ?? "") === claims.email.toLowerCase()
      );
      if (u && String(u.name ?? "")) name = String(u.name);
    } catch {}
  }
  if (!name) name = "Mehman";

  const total = qs.length;
  const scores = loadScores();
  scores.push({ name, score, total, ts: Date.now() });
  saveScores(scores.slice(-500));

  return Response.json({ ok: true, score, total, leaderboard: top() });
}
