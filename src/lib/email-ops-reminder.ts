import { Resend } from "resend";
import { buildEmailHeaderBannerHtml } from "@/lib/email";
import { getPublicSiteUrl } from "@/lib/public-site-url";

function getFromEmail(): string {
  let raw = (process.env.RESEND_FROM_EMAIL ?? "").trim().replace(/^["']|["']$/g, "");
  if (!raw) return "TransPool24 <onboarding@resend.dev>";
  const angleMatch = raw.match(/\s*<\s*([^\s@]+@[^\s@]+\.[^\s@]+)\s*>$/);
  const email = angleMatch ? angleMatch[1] : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : "";
  return email ? `TransPool24 <${email}>` : "TransPool24 <onboarding@resend.dev>";
}

export async function sendOpsStatusReminderEmail(
  to: string,
  job: { id: string; order_number: number | null; company_name: string; confirmation_token: string | null },
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY missing" };
  const site = getPublicSiteUrl().replace(/\/$/, "");
  const orderRef = job.order_number != null ? String(job.order_number) : job.id.slice(0, 8);
  const trackUrl = job.confirmation_token
    ? `${site}/de/order/track?job_id=${encodeURIComponent(job.id)}&token=${encodeURIComponent(job.confirmation_token)}`
    : null;
  const resend = new Resend(apiKey);
  const html = `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8" /></head>
<body style="margin:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#f4f4f4;">
${buildEmailHeaderBannerHtml()}
<div style="max-width:600px;margin:0 auto;padding:24px 20px;">
  <div style="background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <p style="margin:0 0 12px;font-size:16px;color:#0d2137;">Guten Tag,</p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#334155;">
      Ihr Auftrag <strong>#${escapeHtml(orderRef)}</strong> (${escapeHtml(job.company_name || "Kunde")}) ist bei uns eingegangen und wird bearbeitet.
      Sie müssen nichts tun — wir melden uns bei Änderungen.
    </p>
    ${
      trackUrl
        ? `<p style="margin:16px 0 0;font-size:15px;"><a href="${escapeHtml(trackUrl)}" style="color:#0f766e;font-weight:600;">Sendung verfolgen</a></p>`
        : ""
    }
    <p style="margin:20px 0 0;font-size:13px;color:#64748b;">TransPool24 · Pforzheim &amp; Region</p>
  </div>
</div>
</body></html>`;
  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to: [to],
    subject: `TransPool24 – Ihr Auftrag #${orderRef} wird bearbeitet`,
    html,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
