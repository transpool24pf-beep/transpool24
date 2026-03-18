import { Resend } from "resend";
import type { Job } from "./supabase";
import { generateInvoicePdf } from "./invoice-pdf";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "TransPool24 <onboarding@resend.dev>";

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
      const errMsg =
        typeof error === "string"
          ? error
          : (error && typeof error === "object" && "message" in error)
            ? String((error as { message: unknown }).message)
            : JSON.stringify(error);
      return { success: false, error: errMsg };
    }
    return { success: true };
  } catch (e) {
    console.error("[TransPool24] Send confirmation email failed:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
