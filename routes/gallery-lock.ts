import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export const description = "Gallery password lock";

const FILE = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data", "gallery-lock.json");

const getPass = (): string => {
  try {
    return String(JSON.parse(readFileSync(FILE, "utf-8")).pass ?? "");
  } catch {
    return "Love";
  }
};

const setPass = (pass: string) => {
  mkdirSync(join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify({ pass }));
};

export async function POST(req: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }
  // optional: owner can change the password (token se verify)
  if (body.action === "set" && body.newpass) {
    const token = String(body.token ?? "");
    try {
      const usersFile = join(process.env.SAQIB_DATA_DIR || "/tmp/saqib-portfolio-data", "data", "portfolio-users.json");
      const db = JSON.parse(readFileSync(usersFile, "utf-8"));
      const s = (db.sessions ?? []).find((x: Record<string, unknown>) => String(x.token ?? x.id ?? "") === token);
      const u = (db.users ?? []).find((x: Record<string, unknown>) => u_email(s) === String(x.email ?? ""));
      if (!u || u.email !== "fizanali6267@gmail.com") {
        return Response.json({ ok: false, error: "denied" }, { status: 403 });
      }
      setPass(String(body.newpass));
      return Response.json({ ok: true, changed: true });
    } catch {
      return Response.json({ ok: false, error: "denied" }, { status: 403 });
    }
  }
  const pass = String(body.pass ?? "");
  if (pass && pass === getPass()) {
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false, error: "wrong" }, { status: 401 });
}

function u_email(s: Record<string, unknown> | undefined): string {
  return s ? String(s.email ?? "") : "";
}
