import { readApprovalToken, decideByEmail } from "./auth.js";
import { esc } from "./mailer.js";

export const description = "Owner approval landing page — one click from the approval email";

// This route is opened from an email client, so it must return HTML, not JSON.
const page = (opts: { title: string; body: string; tone: "good" | "bad" | "warn" }) => {
  const accent = opts.tone === "good" ? "#5ad19a" : opts.tone === "bad" ? "#e2708a" : "#e0b357";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(opts.title)} — Saqib Iqbal</title>
<style>
 :root{color-scheme:dark}
 body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:radial-gradient(1200px 600px at 50% -10%,#241a3d,#0b0714 60%);
      font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#efeaff;padding:24px}
 .card{max-width:440px;width:100%;background:#140e22;border:1px solid #2a2140;border-radius:18px;
       padding:30px 26px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.5)}
 .dot{width:52px;height:52px;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;
      justify-content:center;font-size:26px;background:${accent}22;border:1px solid ${accent}55}
 h1{margin:0 0 8px;font-size:20px;font-weight:600}
 p{margin:0 0 6px;color:#b4a8d6;font-size:14px;line-height:1.6}
 .who{margin:14px 0 18px;padding:12px;border-radius:12px;background:#1b1430;border:1px solid #2e2448;
      font-size:14px;color:#e9e2ff;word-break:break-all}
 a.btn{display:inline-block;margin-top:6px;background:#6d4bd8;color:#fff;text-decoration:none;
       padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px}
 .foot{margin-top:18px;color:#6f6491;font-size:12px}
</style></head><body><div class="card">
 <div class="dot">${opts.tone === "good" ? "✓" : opts.tone === "bad" ? "✕" : "!"}</div>
 <h1>${esc(opts.title)}</h1>
 ${opts.body}
 <div class="foot">Saqib Iqbal — Portfolio</div>
</div></body></html>`;
};

const html = (s: string, status = 200) =>
  new Response(s, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url, "http://localhost");
  const token = String(url.searchParams.get("token") ?? "");
  const decision = String(url.searchParams.get("d") ?? "yes").toLowerCase() === "no" ? "no" : "yes";

  const email = readApprovalToken(token);
  if (!email) {
    return html(page({
      title: "Link expired", tone: "warn",
      body: `<p>This approval link is no longer valid. It may have been used already, or it is older than 7 days.</p>
             <p>You can still approve this person from the site itself — open <b>/more</b> while logged in and check the pending list.</p>`,
    }), 400);
  }

  const r = await decideByEmail(email, decision === "yes");
  if (!r.ok) {
    return html(page({
      title: r.error === "not_found" ? "Account not found" : "Could not update", tone: "bad",
      body: `<p>${esc(r.error === "not_found" ? "That account no longer exists — it may have been denied or removed." : "Something went wrong. Try approving from the site instead.")}</p>`,
    }), r.error === "not_found" ? 404 : 500);
  }

  if (decision === "no") {
    return html(page({
      title: "Request denied", tone: "bad",
      body: `<p>The account was removed. They cannot log in.</p>
             <div class="who">${esc(email)}</div>`,
    }));
  }

  return html(page({
    title: "Account approved", tone: "good",
    body: `<p>They can log in now with the password they chose at signup.</p>
           <div class="who">${esc(email)}</div>
           <a class="btn" href="/">Open the site</a>`,
  }));
}
