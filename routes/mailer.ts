// Outbound email via Resend (first mail-sending code in this project).
//
// Sending is deliberately best-effort: if RESEND_API_KEY is missing or Resend
// rejects the request, we return { sent:false } instead of throwing, so a mail
// outage can never break signup or login.
//
// NOTE on Resend's test mode: with no verified domain on the account, Resend
// only delivers to the account's own address. That is exactly what the owner
// approval flow needs — every approval email goes to the owner — so no domain
// is required.

export const description = "Outbound email (Resend) — used for owner approval notifications";

const RESEND_URL = "https://api.resend.com/emails";
const FROM = "Saqib Portfolio <onboarding@resend.dev>";

export type MailResult = { sent: boolean; error?: string };

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY || "";
  if (!key) return { sent: false, error: "no_key" };
  try {
    const r = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.text ? { text: opts.text } : {}),
      }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return { sent: false, error: `http_${r.status}:${t.slice(0, 160)}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, error: String(e).slice(0, 160) };
  }
}

export const esc = (s: string) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );

export function approvalEmail(opts: {
  siteUrl: string;
  token: string;
  name: string;
  email: string;
  when: string;
}): { subject: string; html: string; text: string } {
  const approve = `${opts.siteUrl}/v1/x/approve?token=${encodeURIComponent(opts.token)}&d=yes`;
  const deny = `${opts.siteUrl}/v1/x/approve?token=${encodeURIComponent(opts.token)}&d=no`;
  const subject = `New signup — approve ${opts.name}?`;
  const text =
    `New account request on your portfolio.\n\n` +
    `Name:  ${opts.name}\nEmail: ${opts.email}\nTime:  ${opts.when}\n\n` +
    `APPROVE: ${approve}\nDENY:    ${deny}\n\n` +
    `Links valid 7 days. If you do nothing, the account stays pending and cannot log in.`;
  const html = `<!doctype html><html><body style="margin:0;background:#0b0714;padding:24px;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#140e22;border:1px solid #2a2140;border-radius:16px">
    <tr><td style="padding:26px 26px 8px">
      <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#a08cd8">Saqib Iqbal — Portfolio</div>
      <h1 style="margin:10px 0 4px;font-size:21px;color:#f4f0ff;font-weight:600">New account request</h1>
      <p style="margin:0;color:#b9aede;font-size:14px">Someone signed up. Approve to let them in.</p>
    </td></tr>
    <tr><td style="padding:14px 26px 4px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#e7e0ff">
        <tr><td style="padding:6px 0;color:#9d90c4;width:74px">Name</td><td style="padding:6px 0">${esc(opts.name)}</td></tr>
        <tr><td style="padding:6px 0;color:#9d90c4">Email</td><td style="padding:6px 0">${esc(opts.email)}</td></tr>
        <tr><td style="padding:6px 0;color:#9d90c4">Time</td><td style="padding:6px 0">${esc(opts.when)}</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:18px 26px 6px">
      <a href="${approve}" style="display:inline-block;background:#6d4bd8;color:#fff;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:600;font-size:15px">Approve account</a>
      <a href="${deny}" style="display:inline-block;margin-left:8px;color:#9d90c4;text-decoration:none;padding:13px 16px;border-radius:10px;border:1px solid #322852;font-size:14px">Deny</a>
    </td></tr>
    <tr><td style="padding:14px 26px 26px;color:#7e719f;font-size:12px;line-height:1.6">
      Links work for 7 days. If you ignore this, the account stays pending and cannot log in.<br>
      This address can also log in to the site to review pending accounts.
    </td></tr>
  </table>
</body></html>`;
  return { subject, html, text };
}
