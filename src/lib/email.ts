import { Resend } from "resend";
import type { Job } from "./supabase";
import { generateInvoicePdf } from "./invoice-pdf";

const DEFAULT_FROM = "TransPool24 <onboarding@resend.dev>";

function getValidFromEmail(): string {
  let raw = process.env.RESEND_FROM_EMAIL ?? "";
  raw = raw.trim().replace(/^["']|["']$/g, "");
  if (!raw) return DEFAULT_FROM;
  let email = "";
  const angleMatch = raw.match(/\s*<\s*([^\s@]+@[^\s@]+\.[^\s@]+)\s*>$/);
  if (angleMatch) email = angleMatch[1];
  else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) email = raw;
  if (!email) return DEFAULT_FROM;
  return `TransPool24 <${email}>`;
}

const FROM_EMAIL = getValidFromEmail();

function buildConfirmationHtml(job: Job, rateDriverUrl?: string | null): string {
  const totalEur = (job.price_cents / 100).toFixed(2);
  const date = new Date(job.created_at).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const rateBlock =
    rateDriverUrl && rateDriverUrl.length > 0
      ? `
  <p style="margin-top: 20px; padding: 12px; background: #f0f9ff; border-radius: 8px;">
    <strong>Bewerten Sie Ihren Fahrer:</strong> So helfen Sie uns, den Service zu verbessern.<br>
    <a href="${rateDriverUrl}" style="display: inline-block; margin-top: 8px; padding: 10px 20px; background: #1a1a2e; color: white; text-decoration: none; border-radius: 6px;">Fahrer bewerten (1–5 Sterne)</a>
  </p>
  <p style="color: #555; font-size: 12px;">تقييم السائق (نجوم): يساعدنا في تحسين الخدمة.</p>`
      : "";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Zahlungsbestätigung</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a2e;">
  <h1 style="color: #1a1a2e; font-size: 22px;">TransPool24 – Zahlungsbestätigung</h1>
  <p>Vielen Dank für Ihre Bestellung. Die Zahlung wurde erfolgreich verbucht.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;"><strong>Auftragsnummer</strong></td><td style="padding: 6px 0; border-bottom: 1px solid #eee;">${job.id}</td></tr>
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;"><strong>Datum</strong></td><td style="padding: 6px 0; border-bottom: 1px solid #eee;">${date}</td></tr>
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;"><strong>Firma</strong></td><td style="padding: 6px 0; border-bottom: 1px solid #eee;">${job.company_name}</td></tr>
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;"><strong>Abholung</strong></td><td style="padding: 6px 0; border-bottom: 1px solid #eee;">${job.pickup_address}${job.pickup_city ? `, ${job.pickup_city}` : ""}</td></tr>
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;"><strong>Lieferung</strong></td><td style="padding: 6px 0; border-bottom: 1px solid #eee;">${job.delivery_address}${job.delivery_city ? `, ${job.delivery_city}` : ""}</td></tr>
    <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;"><strong>Ladung / Distanz</strong></td><td style="padding: 6px 0; border-bottom: 1px solid #eee;">${job.cargo_size}, ${job.distance_km ?? "-"} km</td></tr>
    <tr><td style="padding: 8px 0;"><strong>Gesamtbetrag</strong></td><td style="padding: 8px 0;">€ ${totalEur}</td></tr>
  </table>
  <p style="color: #555; font-size: 14px;">Ihre Rechnung liegt dieser E-Mail als PDF bei.</p>${rateBlock}
  <p style="color: #555; font-size: 14px;">— TransPool24 · Pforzheim & Region</p>
</body>
</html>
  `.trim();
}

export async function sendOrderConfirmationEmail(
  to: string,
  job: Job & { rating_token?: string | null },
  pdfBuffer: Uint8Array,
  rateDriverUrl?: string | null
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[TransPool24] RESEND_API_KEY not set, skipping confirmation email");
    return { success: false, error: "RESEND_API_KEY not set" };
  }

  const resend = new Resend(apiKey);
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `TransPool24 – Zahlungsbestätigung / Rechnung #${String(job.id).slice(0, 8)}`,
      html: buildConfirmationHtml(job, rateDriverUrl),
      attachments: [
        {
          filename: `TransPool24-Rechnung-${String(job.id).slice(0, 8)}.pdf`,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });
    if (error) {
      console.error("[TransPool24] Resend error:", error);
      const raw =
        typeof error === "string"
          ? error
          : (error && typeof error === "object" && "message" in error)
            ? String((error as { message: unknown }).message)
            : JSON.stringify(error);
      const errMsg =
        /only send testing emails|verify a domain|resend\.com\/domains/i.test(raw)
          ? "حساب Resend في وضع الاختبار أو الدومين غير موثّق. ثبّت الدومين على resend.com/domains واستخدم بريداً من هذا الدومين."
          : raw;
      return { success: false, error: errMsg };
    }
    return { success: true };
  } catch (e) {
    console.error("[TransPool24] Send confirmation email failed:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const errMsg =
      /only send testing emails|verify a domain|resend\.com\/domains/i.test(msg)
        ? "حساب Resend في وضع الاختبار أو الدومين غير موثّق. ثبّت الدومين على resend.com/domains."
        : msg;
    return { success: false, error: errMsg };
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com";
// استخدم 345remov.png إن وُجد في public، وإلا logo.png
const LOGO_URL = `${SITE_URL}/345remov.png`;

export type DriverApprovalData = {
  full_name: string;
  email: string;
  driver_number: number | null;
  approved_at: string;
  vehicle_plate?: string | null;
};

function buildDriverApprovalHtml(data: DriverApprovalData, whatsAppLink?: string | null): string {
  const driverNum = data.driver_number != null ? String(data.driver_number).padStart(5, "0") : "—";
  const dateStr = new Date(data.approved_at).toLocaleDateString("ar-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const ctaUrl = whatsAppLink ?? SITE_URL;
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TransPool24 – موافقة على طلب السائق</title>
</head>
<body style="margin:0; padding:0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background:#f0f0f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0; padding: 24px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0d2137; padding: 20px 24px; text-align: right;">
            <img src="${LOGO_URL}" alt="TransPool24" width="140" height="40" style="height:40px; width:auto; display:block; margin-right:0; margin-left:auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding: 28px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:48px; vertical-align:top; padding-top:4px;">
                  <span style="display:inline-block; width:40px; height:40px; background:#e8f5e9; border-radius:50%; text-align:center; line-height:40px; font-size:20px;">✓</span>
                </td>
                <td>
                  <h1 style="margin:0 0 8px 0; font-size:22px; font-weight:700; color:#0d2137;">
                    تمت الموافقة على طلبك للانضمام كسائق في TransPool24
                  </h1>
                  <p style="margin:0; font-size:15px; color:#333;">
                    مرحباً ${data.full_name || "السائق"}،
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin:20px 0 0 0; font-size:15px; color:#444; line-height:1.6;">
              نود إعلامك بأنه تمت الموافقة على طلبك. يمكنك الآن الانضمام لمجموعة السائقين واستلام الطلبات. أنت في انتظار أول مهمة لقبول العمل.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px; background:#f5f5f5; border-radius:10px; padding: 20px;">
              <tr><td>
                <table width="100%" cellpadding="4" cellspacing="0">
                  <tr><td style="text-align:right; font-weight:600; color:#0d2137;">رقم السائق:</td><td style="text-align:left;">#${driverNum}</td></tr>
                  <tr><td style="text-align:right; font-weight:600; color:#0d2137;">الاسم:</td><td style="text-align:left;">${data.full_name || "—"}</td></tr>
                  <tr><td style="text-align:right; font-weight:600; color:#0d2137;">تاريخ الموافقة:</td><td style="text-align:left;">${dateStr}</td></tr>
                  ${data.vehicle_plate ? `<tr><td style="text-align:right; font-weight:600; color:#0d2137;">رقم السيارة:</td><td style="text-align:left;">${data.vehicle_plate}</td></tr>` : ""}
                </table>
              </td></tr>
            </table>
            <p style="margin:24px 0 12px 0; font-size:14px; color:#555;">
              للانضمام لمجموعة السائقين على واتساب واستلام الطلبات:
            </p>
            <p style="margin:0 0 24px 0;">
              <a href="${ctaUrl}" style="display:inline-block; padding:14px 28px; background:#00BFFF; color:#fff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px;">انضم لمجموعة السائقين (واتساب)</a>
            </p>
            <p style="margin:0; font-size:13px; color:#777;">
              — TransPool24 · Pforzheim & Region<br>
              <a href="${SITE_URL}" style="color:#0d2137;">www.transpool24.com</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0; line-height:0;">
            <img src="${SITE_URL}/134.png" alt="TransPool24" width="560" style="display:block; width:100%; max-width:560px; height:auto;" />
          </td>
        </tr>
        <tr>
          <td style="background:#0d2137; padding: 24px; text-align: center;" dir="ltr" lang="de">
            <p style="margin:0 0 8px 0; font-size:18px; font-weight:700; color:#fff;">
              Ihr Weg ist sicher – und unser Team steht immer hinter Ihnen.
            </p>
            <p style="margin:0; font-size:14px; color:rgba(255,255,255,0.9);">
              Wir sind an Ihrer Seite bei jedem Kilometer.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendDriverApprovalEmail(
  to: string,
  data: DriverApprovalData,
  options?: { whatsAppLink?: string | null; pdfBuffer?: Uint8Array }
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[TransPool24] RESEND_API_KEY not set");
    return { success: false, error: "RESEND_API_KEY not set" };
  }
  const resend = new Resend(apiKey);
  const html = buildDriverApprovalHtml(data, options?.whatsAppLink ?? null);
  const attachments = options?.pdfBuffer
    ? [{ filename: `TransPool24-approval-${String(data.driver_number ?? "driver").padStart(5, "0")}.pdf`, content: Buffer.from(options.pdfBuffer) }]
    : [];
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `TransPool24 – تمت الموافقة على طلبك كسائق #${data.driver_number != null ? String(data.driver_number).padStart(5, "0") : ""}`,
      html,
      attachments,
    });
    if (error) {
      const raw =
        typeof error === "string"
          ? error
          : error && typeof error === "object" && "message" in error
            ? String((error as { message: unknown }).message)
            : JSON.stringify(error);
      const errMsg =
        /only send testing emails|verify a domain|resend\.com\/domains/i.test(raw)
          ? "حساب Resend في وضع الاختبار أو الدومين غير موثّق. للإرسال لأي بريد: ثبّت الدومين على resend.com/domains واستخدم بريداً من هذا الدومين (مثل info@transpool24.com)."
          : raw;
      return { success: false, error: errMsg };
    }
    return { success: true };
  } catch (e) {
    console.error("[TransPool24] Send driver approval email failed:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const errMsg =
      /only send testing emails|verify a domain|resend\.com\/domains/i.test(msg)
        ? "حساب Resend في وضع الاختبار أو الدومين غير موثّق. ثبّت الدومين على resend.com/domains."
        : msg;
    return { success: false, error: errMsg };
  }
}
