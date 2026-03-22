import { Resend } from "resend";
import type { Job } from "./supabase";
import { generateInvoicePdf } from "./invoice-pdf";
import { cargoCategoryLabelDe } from "./cargo";

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

/** Driver info for order confirmation email (from driver_applications) */
export type OrderEmailDriverInfo = {
  full_name: string;
  phone: string;
  vehicle_plate: string | null;
  languages_spoken: string | null;
  personal_photo_url: string | null;
  star_rating: number | null;
};

// ALL EMAIL CONTENT IS IN GERMAN (DE) - NO ARABIC TEXT
function buildConfirmationHtml(
  job: Job,
  options: {
    confirmPaymentUrl?: string | null;
    trackOrderUrl?: string | null;
    rateDriverUrl?: string | null;
    driver?: OrderEmailDriverInfo | null;
  } = {}
): string {
  const { confirmPaymentUrl, trackOrderUrl, rateDriverUrl, driver } = options;
  const totalEur = (job.price_cents / 100).toFixed(2);
  const orderRef = job.order_number != null ? String(job.order_number) : job.id.slice(0, 8);
  const date = new Date(job.created_at).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const headerBlue = "#0d2137";
  const companyName = (job.company_name || "").trim() || "Kunde";
  const driverSection =
    driver
      ? `
  <div style="margin-bottom: 24px; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
    <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold; color: #0d2137;">Fahrerinformationen</p>
    <table cellpadding="0" cellspacing="0" style="font-size: 14px;">
      <tr>
        <td style="vertical-align: top; padding-right: 16px;">
          ${driver.personal_photo_url ? `<img src="${driver.personal_photo_url}" alt="" width="80" height="80" style="border-radius: 50%; object-fit: cover; display: block;" />` : ""}
        </td>
        <td>
          <p style="margin: 0 0 4px 0;"><strong>${escapeHtml(driver.full_name)}</strong></p>
          <p style="margin: 0 0 4px 0; color: #64748b;">${driver.star_rating != null ? driver.star_rating.toFixed(1) : "—"} Sterne</p>
          <p style="margin: 0 0 4px 0;">Telefonnummer: ${escapeHtml(driver.phone)}</p>
          <p style="margin: 0 0 4px 0;">Kennzeichen: ${escapeHtml(driver.vehicle_plate || "—")}</p>
          <p style="margin: 0;">Sprachen: ${escapeHtml(driver.languages_spoken || "—")}</p>
        </td>
      </tr>
    </table>
  </div>`
      : "";
  const rateBlock =
    rateDriverUrl && rateDriverUrl.length > 0
      ? `<p style="margin-top: 16px;"><a href="${rateDriverUrl}" style="color: #0d2137; text-decoration: underline;">Fahrer bewerten (Sterne)</a></p>`
      : "";
  const confirmBtn =
    confirmPaymentUrl && confirmPaymentUrl.length > 0
      ? `
  <p style="margin-top: 24px;">
    <a href="${confirmPaymentUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #e85d04 0%, #f48c06 100%); color: #fff !important; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 20px rgba(232,93,4,0.4);">Zahlung bestätigen / Jetzt zahlen</a>
  </p>`
      : "";
  const trackBlock =
    trackOrderUrl && trackOrderUrl.length > 0
      ? `<p style="margin-top: 16px;"><a href="${trackOrderUrl}" style="display: inline-block; padding: 12px 24px; background: #0d2137; color: #fff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">Auftrag live verfolgen (Status &amp; ETA)</a></p>`
      : "";

  const salutationExtra =
    companyName && companyName !== "Kunde"
      ? `<p style="margin:6px 0 0 0; font-size:16px; color:#334155;">${escapeHtml(companyName)}</p>`
      : "";
  const cd = job.cargo_details as Record<string, unknown> | null;
  const cargoCatRaw = cd?.cargoCategory;
  const cargoCategoryDe =
    typeof cargoCatRaw === "string" && cargoCatRaw.length > 0
      ? cargoCategoryLabelDe(cargoCatRaw)
      : null;

  return `
<!DOCTYPE html>
<html dir="ltr" lang="de">
<head><meta charset="utf-8">${emailDeHeadMeta()}<title>Auftragsbestätigung – TransPool24</title></head>
<body style="margin:0; font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f4; direction:ltr; text-align:left;">
  ${emailHeaderBannerHtml()}
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 32px 20px; direction:ltr;">
    <tr><td style="text-align:left;">
      <div style="background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); direction:ltr; text-align:left;">
        ${driverSection}
        <p style="margin: ${driver ? "24" : "0"}px 0 0 0; font-size: 20px; color: #0d2137; font-weight: bold;">Sehr geehrte Damen und Herren,</p>
        ${salutationExtra}
        <p style="margin: 16px 0 16px 0; font-size: 16px; color: #334155;">Vielen Dank für Ihr Vertrauen in TransPool24.</p>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #475569;">Diese E-Mail bestätigt den erfolgreichen Abschluss Ihres Auftrags. Sie können nun die von Ihnen angeforderten Leistungen in Anspruch nehmen.</p>
        <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold; color: #0d2137;">Ihre Vertragsdetails:</p>
        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-size: 14px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <tr style="background: #f8fafc;"><td style="border-bottom: 1px solid #e2e8f0; color: #64748b;">Auftragsnummer</td><td style="border-bottom: 1px solid #e2e8f0;">${orderRef}</td></tr>
          <tr><td style="border-bottom: 1px solid #e2e8f0; color: #64748b;">Datum</td><td style="border-bottom: 1px solid #e2e8f0;">${date}</td></tr>
          <tr style="background: #f8fafc;"><td style="border-bottom: 1px solid #e2e8f0; color: #64748b;">Abholung</td><td style="border-bottom: 1px solid #e2e8f0;">${escapeHtml(job.pickup_address)}${job.pickup_city ? `, ${job.pickup_city}` : ""}</td></tr>
          <tr><td style="border-bottom: 1px solid #e2e8f0; color: #64748b;">Lieferung</td><td style="border-bottom: 1px solid #e2e8f0;">${escapeHtml(job.delivery_address)}${job.delivery_city ? `, ${job.delivery_city}` : ""}</td></tr>
          <tr style="background: #f8fafc;"><td style="border-bottom: 1px solid #e2e8f0; color: #64748b;">Ladung / Distanz</td><td style="border-bottom: 1px solid #e2e8f0;">${job.cargo_size}, ${job.distance_km ?? "—"} km</td></tr>
          ${cargoCategoryDe ? `<tr><td style="border-bottom: 1px solid #e2e8f0; color: #64748b;">Warenkategorie</td><td style="border-bottom: 1px solid #e2e8f0;">${escapeHtml(cargoCategoryDe)}</td></tr>` : ""}
          <tr><td style="color: #64748b;">Gesamtbetrag</td><td style="font-weight: bold;">€ ${totalEur}</td></tr>
        </table>
        <p style="margin: 16px 0 0 0; font-size: 14px; color: #64748b;">Sie können die Vertragsdetails in Ihrem Produktzugang in der Auftragszusammenfassung unten einsehen. Der angehängte PDF enthält Details zur Fahrt, zum Fahrer und zu den Firmeninformationen.</p>
        ${confirmBtn}
        ${trackBlock}
        ${rateBlock}
        <p style="margin-top: 24px; font-size: 13px; color: #94a3b8;">— TransPool24</p>
        <div style="margin-top: 28px; padding: 24px; background: #0d2137; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #fff;">Folgen Sie uns</p>
          <table cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
            <tr>
              <td style="padding: 0 10px;"><a href="https://www.instagram.com/transpool24/" target="_blank" rel="noopener" style="display:inline-block;"><img src="${SITE_URL}/icons/instagram.png" alt="Instagram" width="32" height="32" style="display:block; width:32px; height:32px;" /></a></td>
              <td style="padding: 0 10px;"><a href="https://www.linkedin.com/in/trans-pool-1235803b8" target="_blank" rel="noopener" style="display:inline-block;"><img src="${SITE_URL}/icons/linkedin.png" alt="LinkedIn" width="32" height="32" style="display:block; width:32px; height:32px;" /></a></td>
              <td style="padding: 0 10px;"><a href="https://www.tiktok.com/@transpool24" target="_blank" rel="noopener" style="display:inline-block;"><img src="${SITE_URL}/icons/tiktok.png" alt="TikTok" width="32" height="32" style="display:block; width:32px; height:32px;" /></a></td>
              <td style="padding: 0 10px;"><a href="mailto:transpool24pf@gmail.com" style="display:inline-block;"><img src="${SITE_URL}/icons/gmail.svg" alt="Gmail" width="32" height="32" style="display:block; width:32px; height:32px;" /></a></td>
              <td style="padding: 0 10px;"><a href="mailto:transpool24@hotmail.com" style="display:inline-block;"><img src="${SITE_URL}/icons/email.svg" alt="Email" width="32" height="32" style="display:block; width:32px; height:32px;" /></a></td>
            </tr>
          </table>
          <p style="margin: 12px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.8);">transpool24pf@gmail.com · transpool24@hotmail.com</p>
        </div>
      </div>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHref(u: string): string {
  return u.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** Formal German labels for logistics_status (raw English is auto-translated by Gmail to Arabic etc.). */
function logisticsStatusLabelDe(status: string | null | undefined): string {
  const s = String(status ?? "")
    .toLowerCase()
    .trim();
  const map: Record<string, string> = {
    draft: "Entwurf",
    confirmed: "Bestätigt",
    paid: "Bezahlt",
    assigned: "Zugewiesen",
    in_transit: "Unterwegs",
    delivered: "Zugestellt",
    cancelled: "Storniert",
  };
  if (!s) return "—";
  return map[s] ?? s.replace(/_/g, " ");
}

/** Discourage Gmail “Translate message” / wrong RTL for German-only transactional mail. */
function emailDeHeadMeta(): string {
  return `<meta http-equiv="Content-Language" content="de" />
<meta name="google" content="notranslate" />`;
}

export async function sendOrderConfirmationEmail(
  to: string,
  job: Job & { rating_token?: string | null },
  pdfBuffer: Uint8Array,
  options: {
    rateDriverUrl?: string | null;
    confirmPaymentUrl?: string | null;
    trackOrderUrl?: string | null;
    driver?: OrderEmailDriverInfo | null;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[TransPool24] RESEND_API_KEY not set, skipping confirmation email");
    return { success: false, error: "RESEND_API_KEY not set" };
  }

  const orderRef = job.order_number != null ? String(job.order_number) : job.id.slice(0, 8);
  const resend = new Resend(apiKey);
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `TransPool24 – Auftragsbestätigung #${orderRef}`,
      html: buildConfirmationHtml(job, {
        confirmPaymentUrl: options.confirmPaymentUrl,
        trackOrderUrl: options.trackOrderUrl,
        rateDriverUrl: options.rateDriverUrl,
        driver: options.driver,
      }),
      attachments: [
        {
          filename: `TransPool24-Rechnung-${orderRef}.pdf`,
          content: Buffer.from(pdfBuffer).toString("base64"),
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
          ? "Resend-Konto befindet sich im Testmodus oder die Domain ist nicht verifiziert. Verifizieren Sie die Domain auf resend.com/domains und verwenden Sie eine E-Mail-Adresse von dieser Domain."
          : raw;
      return { success: false, error: errMsg };
    }
    return { success: true };
  } catch (e) {
    console.error("[TransPool24] Send confirmation email failed:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const errMsg =
      /only send testing emails|verify a domain|resend\.com\/domains/i.test(msg)
        ? "Resend-Konto befindet sich im Testmodus oder die Domain ist nicht verifiziert. Verifizieren Sie die Domain auf resend.com/domains."
        : msg;
    return { success: false, error: errMsg };
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com";
const LOGO_BLUE_URL = `${SITE_URL}/356.png`;
/** Banner from assets/Snapshot_1.PNG → public/transpool24-email-banner.png. Bump EMAIL_HEADER_CACHE_BUST after each image replace (defeats Gmail/proxy cache). */
const EMAIL_HEADER_CACHE_BUST =
  process.env.EMAIL_HEADER_CACHE_BUST?.trim() || "20260320a";
const EMAIL_HEADER_WIDTH = 600;
const EMAIL_HEADER_HEIGHT = 120;
const EMAIL_HEADER_BANNER_URL = `${SITE_URL}/transpool24-email-banner.png?v=${encodeURIComponent(EMAIL_HEADER_CACHE_BUST)}`;

/** Top-of-email header (full width in clients, max 600px) */
function emailHeaderBannerHtml(): string {
  const bg = "#0d2137";
  const h = EMAIL_HEADER_HEIGHT;
  const w = EMAIL_HEADER_WIDTH;
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${bg};">
    <tr>
      <td align="center" style="padding:0; line-height:0; font-size:0;">
        <img src="${EMAIL_HEADER_BANNER_URL}" alt="TransPool24" width="${w}" height="${h}" style="display:block; width:100%; max-width:${w}px; height:${h}px; margin:0 auto; border:0; outline:none;" />
      </td>
    </tr>
  </table>`;
}

export function buildEmailHeaderBannerHtml(): string {
  return emailHeaderBannerHtml();
}

/** Dedicated tracking email: German only, driver card, no PDF (Resend). */
function buildTrackingUpdateHtml(
  job: Job,
  options: {
    trackOrderUrl: string;
    googleMapsDirectionsUrl: string;
    driver?: OrderEmailDriverInfo | null;
  }
): string {
  const headerBlue = "#0d2137";
  const orderRef = job.order_number != null ? String(job.order_number) : job.id.slice(0, 8);
  const companyName = (job.company_name || "").trim();
  const statusDe = logisticsStatusLabelDe(job.logistics_status);
  const etaDe =
    job.estimated_arrival_at != null
      ? new Date(job.estimated_arrival_at).toLocaleString("de-DE", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : null;
  const distStr = job.distance_km != null ? `${job.distance_km} km` : "—";
  const cdTrack = job.cargo_details as Record<string, unknown> | null;
  const cargoCatTrack =
    typeof cdTrack?.cargoCategory === "string" && cdTrack.cargoCategory.length > 0
      ? cargoCategoryLabelDe(cdTrack.cargoCategory)
      : null;

  const driverBlock =
    options.driver && options.driver.full_name
      ? `
  <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
    <tr><td style="padding:18px;">
      <p style="margin:0 0 10px 0; font-size:15px; font-weight:bold; color:${headerBlue};">Ihr Fahrer</p>
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:top; padding-right:16px;">
          ${options.driver.personal_photo_url ? `<img src="${escapeHtml(options.driver.personal_photo_url)}" alt="" width="88" height="88" style="border-radius:50%; object-fit:cover; display:block;" />` : ""}
        </td>
        <td style="vertical-align:top; font-size:14px; color:#334155;">
          <p style="margin:0 0 6px 0;"><strong>${escapeHtml(options.driver.full_name)}</strong></p>
          <p style="margin:0 0 4px 0; color:#64748b;">${options.driver.star_rating != null ? `${options.driver.star_rating.toFixed(1)} Sterne` : "—"}</p>
          <p style="margin:0 0 4px 0;">Telefonnummer: ${escapeHtml(options.driver.phone)}</p>
          <p style="margin:0 0 4px 0;">Kennzeichen: ${escapeHtml(options.driver.vehicle_plate || "—")}</p>
          <p style="margin:0;">Sprachen: ${escapeHtml(options.driver.languages_spoken || "—")}</p>
        </td>
      </tr></table>
    </td></tr>
  </table>`
      : `
  <p style="margin:0 0 16px 0; padding:12px; background:#fff7ed; border-radius:8px; font-size:14px; color:#9a3412; border:1px solid #fed7aa;">
    Hinweis: Sobald ein Fahrer zugewiesen ist, finden Sie auf der Tracking-Seite Foto und Kontaktdaten.
  </p>`;

  const companyLine =
    companyName.length > 0
      ? `<p style="margin:6px 0 0 0; font-size:15px; color:#334155;">${escapeHtml(companyName)}</p>`
      : "";

  return `
<!DOCTYPE html>
<html dir="ltr" lang="de">
<head><meta charset="utf-8">${emailDeHeadMeta()}<title>TransPool24 – Sendungsverfolgung</title></head>
<body style="margin:0; font-family:'Segoe UI',Tahoma,Arial,sans-serif; background:#eef2f6; direction:ltr; text-align:left;">
  ${emailHeaderBannerHtml()}
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; margin:0 auto; padding:28px 16px; direction:ltr;">
    <tr><td style="text-align:left;">
      <div style="background:#fff; border-radius:14px; padding:26px; box-shadow:0 2px 14px rgba(0,0,0,0.07); direction:ltr; text-align:left;">
        <p style="margin:0 0 0 0; font-size:17px; font-weight:bold; color:${headerBlue};">Sehr geehrte Damen und Herren,</p>
        ${companyLine}
        <p style="margin:14px 0 10px 0; font-size:15px; color:#334155; line-height:1.6;">
          Vielen Dank für Ihr Vertrauen in TransPool24. Auf der verlinkten Seite finden Sie den <strong>aktuellen Lieferstatus</strong>
          sowie – sobald verfügbar – die <strong>voraussichtliche Ankunftszeit</strong>.
        </p>
        <p style="margin:0 0 10px 0; font-size:15px; color:#334155; line-height:1.6;">
          Sobald der zugewiesene Fahrer seinen Standort (GPS) teilt, erscheint automatisch eine <strong>Live-Karte</strong> mit <strong>Fahrspur</strong>.
          Bis dahin dient die geplante Route (Abholung → Zustellung) zur Orientierung.
        </p>
        <p style="margin:0 0 18px 0; font-size:14px; color:#64748b;">Auftragsnummer: <strong>#${escapeHtml(orderRef)}</strong><br />
        Status: <strong>${escapeHtml(statusDe)}</strong><br />
        Distanz (ca.): <strong>${escapeHtml(distStr)}</strong></p>
        ${cargoCatTrack ? `<p style="margin:-8px 0 14px 0; font-size:14px; color:#64748b;">Warenkategorie: <strong>${escapeHtml(cargoCatTrack)}</strong></p>` : ""}
        ${etaDe ? `<p style="margin:-12px 0 18px 0; font-size:14px; color:#0f766e;">Voraussichtliche Ankunft: <strong>${escapeHtml(etaDe)}</strong></p>` : ""}
        ${driverBlock}
        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse; font-size:14px; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:18px;">
          <tr style="background:#f8fafc;"><td style="color:#64748b; width:32%;">Abholung</td><td>${escapeHtml(job.pickup_address)}</td></tr>
          <tr><td style="color:#64748b;">Zustellung</td><td>${escapeHtml(job.delivery_address)}</td></tr>
        </table>
        <p style="margin:0 0 14px 0; text-align:center;">
          <a href="${escapeHref(options.trackOrderUrl)}" style="display:inline-block; padding:16px 28px; background:linear-gradient(135deg,#e85d04 0%,#f48c06 100%); color:#fff !important; text-decoration:none; border-radius:12px; font-weight:bold; font-size:17px; box-shadow:0 4px 18px rgba(232,93,4,0.35);">
            Jetzt live verfolgen
          </a>
        </p>
        <p style="margin:0 0 8px 0; text-align:center; font-size:14px;">
          <a href="${escapeHref(options.googleMapsDirectionsUrl)}" style="color:${headerBlue}; text-decoration:underline;">Route in Google Maps öffnen</a>
        </p>
        <p style="margin:16px 0 0 0; font-size:12px; color:#94a3b8; text-align:center;">TransPool24 · Pforzheim &amp; Region · Diese E-Mail enthält keinen PDF-Anhang.</p>
      </div>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

export async function sendTrackingUpdateEmail(
  to: string,
  job: Job,
  options: {
    trackOrderUrl: string;
    googleMapsDirectionsUrl: string;
    driver?: OrderEmailDriverInfo | null;
  }
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY not set" };
  }
  const orderRef = job.order_number != null ? String(job.order_number) : job.id.slice(0, 8);
  const resend = new Resend(apiKey);
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `TransPool24 – Live-Tracking Auftrag #${orderRef}`,
      html: buildTrackingUpdateHtml(job, options),
    });
    if (error) {
      const raw =
        typeof error === "string"
          ? error
          : error && typeof error === "object" && "message" in error
            ? String((error as { message: unknown }).message)
            : JSON.stringify(error);
      return { success: false, error: raw };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
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
  ${emailDeHeadMeta()}
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TransPool24 – Fahrer-Anfrage genehmigt</title>
</head>
<body style="margin:0; padding:0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background:#f0f0f0; direction:ltr; text-align:left;">
  ${emailHeaderBannerHtml()}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0; padding: 24px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="padding: 28px 24px;">
            ${driverPhoto ? `<p style="text-align:center; margin:0 0 16px 0;"><img src="${escapeHref(driverPhoto)}" alt="" width="120" height="120" style="width:120px; height:120px; border-radius:50%; object-fit:cover; display:inline-block; border:4px solid ${ORANGE};" /></p>` : ""}
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:48px; vertical-align:top; padding-top:4px;">
                  <span style="display:inline-block; width:40px; height:40px; background:#e8f5e9; border-radius:50%; text-align:center; line-height:40px; font-size:20px;">✓</span>
                </td>
                <td style="vertical-align:top;">
                  <h1 style="margin:0 0 8px 0; font-size:22px; font-weight:700; color:#0d2137;">
                    Ihre Anfrage zur Aufnahme als Fahrer bei TransPool24 wurde genehmigt.
                  </h1>
                  <p style="margin:0; font-size:15px; color:#333;">Sehr geehrte Damen und Herren,</p>
                  ${(data.full_name || "").trim() ? `<p style="margin:6px 0 0 0; font-size:15px; color:#333;">${escapeHtml((data.full_name || "").trim())}</p>` : ""}
                </td>
              </tr>
            </table>
            <p style="margin:20px 0 0 0; font-size:15px; color:#444; line-height:1.6;">
              Wir freuen uns, Ihnen mitteilen zu dürfen, dass Ihre Anfrage genehmigt wurde. Treten Sie der Fahrergruppe bei WhatsApp bei, um Aufträge zu erhalten und anzunehmen. Wir freuen uns auf Ihre erste Zusage.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px; background:#f5f5f5; border-radius:10px; padding: 20px;">
              <tr><td>
                <table width="100%" cellpadding="4" cellspacing="0">
                  <tr><td style="text-align:left; font-weight:600; color:#0d2137;">Fahrernummer:</td><td style="text-align:right;">#${driverNum}</td></tr>
                  <tr><td style="text-align:left; font-weight:600; color:#0d2137;">Name:</td><td style="text-align:right;">${escapeHtml(data.full_name || "—")}</td></tr>
                  <tr><td style="text-align:left; font-weight:600; color:#0d2137;">Genehmigungsdatum:</td><td style="text-align:right;">${dateStr}</td></tr>
                  ${data.vehicle_plate ? `<tr><td style="text-align:left; font-weight:600; color:#0d2137;">Kennzeichen:</td><td style="text-align:right;">${escapeHtml(data.vehicle_plate)}</td></tr>` : ""}
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
  const supportUrl = `${SITE_URL}/de/support`;
  const instagramUrl = `${SITE_URL}/icons/instagram.png`;
  const linkedinUrl = `${SITE_URL}/icons/linkedin.png`;
  const tiktokUrl = `${SITE_URL}/icons/tiktok.png`;
  return `
<!DOCTYPE html>
<html dir="ltr" lang="de">
<head><meta charset="utf-8">${emailDeHeadMeta()}<title>Zahlungsnachweis – TransPool24</title></head>
<body style="margin:0; font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f4; direction:ltr; text-align:left;">
  ${emailHeaderBannerHtml()}
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #fff; border-bottom: 1px solid #eee;"><tr><td align="right" style="padding: 8px 24px;"><a href="${SITE_URL}" style="color:#000; text-decoration:underline; font-size:13px;">www.transpool24.com</a></td></tr></table>
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 32px 20px; direction:ltr;">
    <tr><td style="text-align:left;">
      <div style="background: ${cardBg}; border-radius: 12px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); direction:ltr; text-align:left;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="48" style="vertical-align:top;"><div style="width:40px; height:40px; background: #0d2137; border-radius: 8px;"></div></td>
            <td>
              <h1 style="margin: 0 0 8px 0; font-size: 20px; color: #0d2137;">Ihre TransPool24-Rechnung Nr. ${data.invoice_number} vom ${data.date} ist eingegangen</h1>
            </td>
          </tr>
        </table>
        <p style="margin: 20px 0 0 0; font-size: 16px; color: #333;">Sehr geehrte Damen und Herren,</p>
        <p style="margin: 8px 0 16px 0; font-size: 15px; color: #555;">den Zahlungsnachweis finden Sie als PDF-Datei im Anhang dieser E-Mail.</p>
        <div style="background: ${summaryBg}; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px;">
            <tr><td style="color:#555;"><strong>Rechnungsnummer:</strong></td><td style="text-align:left;">${data.invoice_number}</td></tr>
            <tr><td style="color:#555;"><strong>Rechnungsdatum:</strong></td><td style="text-align:left;">${data.date}</td></tr>
            <tr><td style="color:#555;"><strong>Fahrernummer:</strong></td><td style="text-align:left;">${data.driver_number}</td></tr>
            <tr><td style="color:#555;"><strong>Vertragsnummer:</strong></td><td style="text-align:left;">${data.contract_number}</td></tr>
            <tr><td style="color:#555;"><strong>Betrag:</strong></td><td style="text-align:left;">${data.amount_eur} EUR</td></tr>
            <tr><td style="color:#555;"><strong>Trinkgeld:</strong></td><td style="text-align:left;">${data.tip_eur} EUR</td></tr>
            <tr><td style="color:#0d2137; padding-top:8px;"><strong>Gesamtbetrag:</strong></td><td style="text-align:left; padding-top:8px;"><strong>${data.total_eur} EUR</strong></td></tr>
          </table>
        </div>
        <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">Benötigen Sie Unterstützung? TransPool24 Kundenservice – Telefonnummer: +49 176 29767442 – E-Mail: transpool24@hotmail.com</p>
        <p style="margin: 12px 0 0 0; font-size: 13px;"><a href="https://www.linkedin.com/in/trans-pool-1235803b8" style="color:#0d2137;">LinkedIn</a> · Servicezeiten: rund um die Uhr</p>
      </div>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 0 20px 24px;">
    <tr><td>
      <div style="background: ${headerBlue}; border-radius: 0 0 16px 16px; padding: 32px 24px; text-align: center;">
        <img src="${LOGO_BLUE_URL}" alt="TransPool24" width="280" height="80" style="display:block; margin: 0 auto 20px; max-width:280px; height:auto; max-height:80px;" />
        <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: bold; color: #ffffff;">Ihr Weg ist sicher – und unser Team steht immer hinter Ihnen.</p>
        <a href="${supportUrl}" style="display: inline-block; margin: 0 0 24px 0; padding: 14px 28px; background: #00BFFF; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">Wir sind an Ihrer Seite bei jedem Kilometer.</a>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: rgba(255,255,255,0.9);">Folgen Sie uns</p>
        <table cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
          <tr>
            <td style="padding: 0 10px;"><a href="https://www.tiktok.com/@transpool24" target="_blank" rel="noopener"><img src="${tiktokUrl}" alt="TikTok" width="32" height="32" style="display:block; width:32px; height:32px;" /></a></td>
            <td style="padding: 0 10px;"><a href="https://www.linkedin.com/in/trans-pool-1235803b8" target="_blank" rel="noopener"><img src="${linkedinUrl}" alt="LinkedIn" width="32" height="32" style="display:block; width:32px; height:32px;" /></a></td>
            <td style="padding: 0 10px;"><a href="https://www.instagram.com/transpool24/" target="_blank" rel="noopener"><img src="${instagramUrl}" alt="Instagram" width="32" height="32" style="display:block; width:32px; height:32px;" /></a></td>
          </tr>
        </table>
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
      subject: `TransPool24 – Zahlungsnachweis ${data.invoice_number}`,
      html: buildDriverPaymentInvoiceEmailHtml(data),
      attachments: [{ filename: pdfFilename, content: attachmentContent }],
    });
    if (error) {
      const raw = typeof error === "string" ? error : (error && typeof error === "object" && "message" in error) ? String((error as { message: unknown }).message) : JSON.stringify(error);
      const errMsg = /only send testing emails|verify a domain|resend\.com\/domains/i.test(raw)
        ? "Resend-Konto befindet sich im Testmodus oder die Domain ist nicht verifiziert. Verifizieren Sie die Domain auf resend.com/domains."
        : raw;
      return { success: false, error: errMsg };
    }
    return { success: true };
  } catch (e) {
    console.error("[TransPool24] Send payment invoice email failed:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const errMsg = /only send testing emails|verify a domain|resend\.com\/domains/i.test(msg)
      ? "Resend-Konto befindet sich im Testmodus oder die Domain ist nicht verifiziert. Verifizieren Sie die Domain auf resend.com/domains."
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
          ? "Resend-Konto befindet sich im Testmodus oder die Domain ist nicht verifiziert. Zum Senden an jede E-Mail-Adresse: Verifizieren Sie die Domain auf resend.com/domains und verwenden Sie eine E-Mail-Adresse von dieser Domain (z.B. info@transpool24.com)."
          : raw;
      return { success: false, error: errMsg };
    }
    return { success: true };
  } catch (e) {
    console.error("[TransPool24] Send driver approval email failed:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const errMsg =
      /only send testing emails|verify a domain|resend\.com\/domains/i.test(msg)
        ? "Resend-Konto befindet sich im Testmodus oder die Domain ist nicht verifiziert. Verifizieren Sie die Domain auf resend.com/domains."
        : msg;
    return { success: false, error: errMsg };
  }
}
