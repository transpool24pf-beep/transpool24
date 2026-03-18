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
const LOGO_URL = `${SITE_URL}/345remov.png`;
const LOGO_ORANGE_URL = `${SITE_URL}/567.png`;
const LOGO_BLUE_URL = `${SITE_URL}/356.png`;
const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/ESup6od1fkHCixxMrT162q?mode=gi_t";
const QR_WHATSAPP_URL = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&bgcolor=FFFFFF&color=000000&data=${encodeURIComponent(WHATSAPP_GROUP_LINK)}`;
const ORANGE = "#e85d04";

export type DriverApprovalData = {
  full_name: string;
  email: string;
  driver_number: number | null;
  approved_at: string;
  vehicle_plate?: string | null;
  personal_photo_url?: string | null;
};

function buildDriverApprovalHtml(data: DriverApprovalData, whatsAppLink?: string | null): string {
  const driverNum = data.driver_number != null ? String(data.driver_number).padStart(5, "0") : "—";
  const dateStr = new Date(data.approved_at).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const ctaUrl = whatsAppLink ?? WHATSAPP_GROUP_LINK;
  const driverPhoto = data.personal_photo_url?.trim();
  return `
<!DOCTYPE html>
<html dir="ltr" lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TransPool24 – Fahrer-Anfrage genehmigt</title>
</head>
<body style="margin:0; padding:0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background:#f0f0f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0; padding: 24px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${ORANGE}; padding: 28px 32px; text-align: center;">
            <img src="${LOGO_ORANGE_URL}" alt="TransPool24" width="400" height="110" style="height:110px; width:auto; max-width:400px; display:block; margin:0 auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding: 28px 24px;">
            ${driverPhoto ? `<p style="text-align:center; margin:0 0 16px 0;"><img src="${driverPhoto}" alt="" width="120" height="120" style="width:120px; height:120px; border-radius:50%; object-fit:cover; display:inline-block; border:4px solid ${ORANGE};" /></p>` : ""}
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:48px; vertical-align:top; padding-top:4px;">
                  <span style="display:inline-block; width:40px; height:40px; background:#e8f5e9; border-radius:50%; text-align:center; line-height:40px; font-size:20px;">✓</span>
                </td>
                <td style="vertical-align:top;">
                  <h1 style="margin:0 0 8px 0; font-size:22px; font-weight:700; color:#0d2137;">
                    Ihre Anfrage zur Aufnahme als Fahrer bei TransPool24 wurde genehmigt.
                  </h1>
                  <p style="margin:0; font-size:15px; color:#333;">
                    Hallo ${data.full_name || "Fahrer"},
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin:20px 0 0 0; font-size:15px; color:#444; line-height:1.6;">
              Wir freuen uns, Ihnen mitzuteilen, dass Ihre Anfrage genehmigt wurde. Sie können jetzt der Fahrergruppe beitreten und Aufträge entgegennehmen. Sie warten auf Ihre erste Aufgabe zur Annahme.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px; background:#f5f5f5; border-radius:10px; padding: 20px;">
              <tr><td>
                <table width="100%" cellpadding="4" cellspacing="0">
                  <tr><td style="text-align:left; font-weight:600; color:#0d2137;">Fahrernummer:</td><td style="text-align:right;">#${driverNum}</td></tr>
                  <tr><td style="text-align:left; font-weight:600; color:#0d2137;">Name:</td><td style="text-align:right;">${data.full_name || "—"}</td></tr>
                  <tr><td style="text-align:left; font-weight:600; color:#0d2137;">Genehmigungsdatum:</td><td style="text-align:right;">${dateStr}</td></tr>
                  ${data.vehicle_plate ? `<tr><td style="text-align:left; font-weight:600; color:#0d2137;">Kennzeichen:</td><td style="text-align:right;">${data.vehicle_plate}</td></tr>` : ""}
                </table>
              </td></tr>
            </table>
            <p style="margin:24px 0 12px 0; font-size:14px; color:#555;">
              Zum Beitritt zur Fahrergruppe bei WhatsApp und zum Erhalt von Aufträgen:
            </p>
            <p style="margin:0 0 16px 0;">
              <a href="${ctaUrl}" style="display:inline-block; padding:14px 28px; background:#25D366; color:#fff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px;">Fahrergruppe beitreten (WhatsApp)</a>
            </p>
            <p style="margin:0 0 8px 0; font-size:13px; color:#555;">Scannen Sie den QR-Code zum Beitritt zur Gruppe:</p>
            <p style="margin:0 0 24px 0;">
              <img src="${QR_WHATSAPP_URL}" alt="QR-Code WhatsApp" width="140" height="140" style="display:block; width:140px; height:140px; background:#fff; border-radius:12px; padding:8px; border:1px solid #eee;" />
            </p>
            <p style="margin:0; font-size:13px; color:#777;">
              — TransPool24 · Pforzheim & Region<br>
              <a href="${SITE_URL}" style="color:#0d2137;">www.transpool24.com</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#0d2137; padding: 28px 24px; text-align: center;">
            <img src="${LOGO_BLUE_URL}" alt="TransPool24" width="320" height="90" style="height:90px; width:auto; max-width:320px; display:block; margin:0 auto 16px auto; background:transparent;" />
            <p style="margin:0; font-size:18px; font-weight:700; color:#fff; line-height:1.4;">
              Ihr Weg ist sicher – und unser Team steht immer hinter Ihnen.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#0d2137; padding: 0 24px 24px 24px; text-align: center;">
            <a href="${SITE_URL}/de/support" style="display:inline-block; padding:14px 28px; background:#00BFFF; color:#fff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px;">Wir sind an Ihrer Seite bei jedem Kilometer.</a>
          </td>
        </tr>
        <tr>
          <td style="background:#0d2137; padding: 16px 24px 28px; text-align: center;">
            <p style="margin:0 0 12px 0; font-size:12px; color:rgba(255,255,255,0.8);">Folgen Sie uns</p>
            <p style="margin:0; font-size:0; line-height:0;">
              <a href="https://www.instagram.com/transpool24/" target="_blank" rel="noopener" style="display:inline-block; margin:0 14px; vertical-align:middle;"><img src="${SITE_URL}/icons/instagram.png" alt="Instagram" width="32" height="32" style="display:block; width:32px; height:32px;" /></a>
              <a href="https://www.linkedin.com/in/trans-pool-1235803b8" target="_blank" rel="noopener" style="display:inline-block; margin:0 14px; vertical-align:middle;"><img src="${SITE_URL}/icons/linkedin.png" alt="LinkedIn" width="32" height="32" style="display:block; width:32px; height:32px;" /></a>
              <a href="https://www.tiktok.com/@transpool24" target="_blank" rel="noopener" style="display:inline-block; margin:0 14px; vertical-align:middle;"><img src="${SITE_URL}/icons/tiktok.png" alt="TikTok" width="32" height="32" style="display:block; width:32px; height:32px;" /></a>
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

export type DriverPaymentInvoiceEmailData = {
  driver_name: string;
  invoice_number: string;
  date: string;
  driver_number: string;
  contract_number: string;
  amount_eur: string;
  tip_eur: string;
  total_eur: string;
};

function buildDriverPaymentInvoiceEmailHtml(data: DriverPaymentInvoiceEmailData): string {
  const headerBlue = "#0d2137";
  const cardBg = "#ffffff";
  const summaryBg = "#f0f4f8";
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><title>فاتورة التحويل – TransPool24</title></head>
<body style="margin:0; font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: ${headerBlue}; padding: 20px 24px;">
    <tr>
      <td align="right"><img src="${LOGO_URL}" alt="TransPool24" width="140" height="40" style="display:block; height:40px; width:auto;" /></td>
      <td align="left" style="color:#fff; font-size:14px;">TransPool24</td>
    </tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 32px 20px;">
    <tr><td>
      <div style="background: ${cardBg}; border-radius: 12px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="48" style="vertical-align:top;"><div style="width:40px; height:40px; background: #0d2137; border-radius: 8px;"></div></td>
            <td>
              <h1 style="margin: 0 0 8px 0; font-size: 20px; color: #0d2137;">وصلت فاتورة TransPool24 الخاصة بك رقم ${data.invoice_number} بتاريخ ${data.date}</h1>
            </td>
          </tr>
        </table>
        <p style="margin: 20px 0 0 0; font-size: 16px; color: #333;">يوم جيد،</p>
        <p style="margin: 8px 0 16px 0; font-size: 15px; color: #555;">ستجد مرفقاً فاتورة التحويل (Zahlungsnachweis) كملف PDF.</p>
        <div style="background: ${summaryBg}; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px;">
            <tr><td style="color:#555;"><strong>رقم الفاتورة:</strong></td><td style="text-align:left;">${data.invoice_number}</td></tr>
            <tr><td style="color:#555;"><strong>تاريخ الفاتورة:</strong></td><td style="text-align:left;">${data.date}</td></tr>
            <tr><td style="color:#555;"><strong>رقم السائق:</strong></td><td style="text-align:left;">${data.driver_number}</td></tr>
            <tr><td style="color:#555;"><strong>رقم العقد:</strong></td><td style="text-align:left;">${data.contract_number}</td></tr>
            <tr><td style="color:#555;"><strong>المبلغ:</strong></td><td style="text-align:left;">${data.amount_eur} يورو</td></tr>
            <tr><td style="color:#555;"><strong>الإكرامية:</strong></td><td style="text-align:left;">${data.tip_eur} يورو</td></tr>
            <tr><td style="color:#0d2137; padding-top:8px;"><strong>المجموع:</strong></td><td style="text-align:left; padding-top:8px;"><strong>${data.total_eur} يورو</strong></td></tr>
          </table>
        </div>
        <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">هل تحتاج مساعدة؟ خدمة العملاء TransPool24 – الهاتف: +49 176 29767442 – البريد: transpool24@hotmail.com</p>
        <p style="margin: 12px 0 0 0; font-size: 13px;"><a href="https://www.linkedin.com/in/trans-pool-1235803b8" style="color:#0d2137;">LinkedIn</a> · ساعات العمل: على مدار الساعة</p>
      </div>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendDriverPaymentInvoiceEmail(
  to: string,
  data: DriverPaymentInvoiceEmailData,
  pdfBuffer: Uint8Array,
  pdfFilename: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[TransPool24] RESEND_API_KEY not set");
    return { success: false, error: "RESEND_API_KEY not set" };
  }
  const resend = new Resend(apiKey);
  try {
    const attachmentContent = Buffer.from(pdfBuffer).toString("base64");
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `TransPool24 – فاتورة التحويل / Zahlungsnachweis ${data.invoice_number}`,
      html: buildDriverPaymentInvoiceEmailHtml(data),
      attachments: [{ filename: pdfFilename, content: attachmentContent }],
    });
    if (error) {
      const raw = typeof error === "string" ? error : (error && typeof error === "object" && "message" in error) ? String((error as { message: unknown }).message) : JSON.stringify(error);
      const errMsg = /only send testing emails|verify a domain|resend\.com\/domains/i.test(raw)
        ? "حساب Resend في وضع الاختبار أو الدومين غير موثّق. ثبّت الدومين على resend.com/domains."
        : raw;
      return { success: false, error: errMsg };
    }
    return { success: true };
  } catch (e) {
    console.error("[TransPool24] Send payment invoice email failed:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const errMsg = /only send testing emails|verify a domain|resend\.com\/domains/i.test(msg)
      ? "حساب Resend في وضع الاختبار أو الدومين غير موثّق. ثبّت الدومين على resend.com/domains."
      : msg;
    return { success: false, error: errMsg };
  }
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
      subject: `TransPool24 – Ihre Fahrer-Anfrage wurde genehmigt #${data.driver_number != null ? String(data.driver_number).padStart(5, "0") : ""}`,
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
