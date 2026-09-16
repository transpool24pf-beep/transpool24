import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import type { Job } from "./supabase";
import { getPdfLogoBytes, PDF_COMPANY } from "./pdf-company";

export type InvoiceType = "customer" | "driver";

/** Teal from the Numbers Rechnung template */
const TEAL = rgb(0.09, 0.62, 0.62);
const TEAL_DARK = rgb(0.06, 0.42, 0.45);
const LINE = rgb(0.78, 0.86, 0.86);
const ROW_BG = rgb(0.95, 0.97, 0.97);
const GREEN_BG = rgb(0.88, 0.95, 0.88);
const TEXT = rgb(0.12, 0.14, 0.18);
const MUTED = rgb(0.32, 0.38, 0.42);
const WHITE = rgb(1, 1, 1);

/**
 * Standard PDF fonts (Helvetica) use WinAnsi; Arabic, emoji, etc. throw at draw time.
 * Keep Latin-1 + ASCII; map Euro; replace the rest so invoices never crash.
 */
export function sanitizeTextForStandardPdfFont(text: string, maxLen = 2400): string {
  const s = (text ?? "").normalize("NFC").slice(0, maxLen);
  return s
    .replace(/\u20AC/g, "EUR")
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, "?");
}

function formatEur(cents: number): string {
  const n = (Math.round(cents) / 100).toFixed(2).replace(".", ",");
  return `${n} EUR`;
}

function formatDeDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function invoiceNumberForJob(job: Job & { order_number?: number | null }): string {
  const y = new Date(job.created_at || Date.now()).getFullYear();
  if (job.order_number != null) return `${y}-${String(job.order_number).padStart(3, "0")}`;
  return `${y}-${job.id.slice(0, 6).toUpperCase()}`;
}

function parseDeAddress(full: string): { street: string; plzOrt: string } {
  const cleaned = (full ?? "").replace(/,?\s*Deutschland\s*$/i, "").trim();
  const m = cleaned.match(/^(.*?)[,\s]+(\d{5}\s+.+)$/);
  if (m) return { street: m[1].trim().replace(/,$/, ""), plzOrt: m[2].trim() };
  return { street: cleaned, plzOrt: "" };
}

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const safe = sanitizeTextForStandardPdfFont(text);
  if (font.widthOfTextAtSize(safe, size) <= maxWidth) return [safe];
  const words = safe.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) cur = trial;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function drawSafe(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  size: number,
  color = TEXT
): void {
  page.drawText(sanitizeTextForStandardPdfFont(text), { x, y, size, font, color });
}

function drawRight(
  page: PDFPage,
  font: PDFFont,
  text: string,
  right: number,
  y: number,
  size: number,
  color = TEXT
): void {
  const safe = sanitizeTextForStandardPdfFont(text);
  const w = font.widthOfTextAtSize(safe, size);
  page.drawText(safe, { x: right - w, y, size, font, color });
}

function drawCentered(
  page: PDFPage,
  font: PDFFont,
  text: string,
  centerX: number,
  y: number,
  size: number,
  color = TEXT
): void {
  const safe = sanitizeTextForStandardPdfFont(text);
  const w = font.widthOfTextAtSize(safe, size);
  page.drawText(safe, { x: centerX - w / 2, y, size, font, color });
}

function tealBar(page: PDFPage, x: number, yTop: number, w: number, h: number, title: string, fontBold: PDFFont) {
  page.drawRectangle({ x, y: yTop - h, width: w, height: h, color: TEAL });
  drawSafe(page, fontBold, title, x + 8, yTop - h + 5, 8, WHITE);
}

export async function generateInvoicePdf(
  job: Job & { driver_price_cents?: number | null; order_number?: number | null },
  options?: { type?: InvoiceType }
): Promise<Uint8Array> {
  const type = options?.type ?? "customer";
  const defaultDriverCents =
    job.distance_km != null && job.distance_km > 0 ? Math.round(18 * job.distance_km * 2) : 1800;
  const amountCents =
    type === "driver" ? (job.driver_price_cents ?? defaultDriverCents) : job.price_cents;

  const defaultAssistantCents = 1630;
  const hasAssistant = job.service_type === "driver_car_assistant";
  const assistantCents = hasAssistant
    ? job.assistant_price_cents != null && job.assistant_price_cents >= 0
      ? job.assistant_price_cents
      : defaultAssistantCents
    : 0;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const margin = 40;
  const contentW = width - margin * 2;
  const pageMid = width / 2;
  let y = height - 28;

  const logoBytes = await getPdfLogoBytes();
  let logoH = 0;
  if (logoBytes && logoBytes.length > 0) {
    const embed = async () => {
      try {
        return await doc.embedPng(logoBytes);
      } catch {
        return await doc.embedJpg(logoBytes);
      }
    };
    try {
      const img = await embed();
      const imgW = 210;
      const imgH = Math.min(58, (img.height / img.width) * imgW);
      logoH = imgH;
      page.drawImage(img, { x: margin, y: y - imgH, width: imgW, height: imgH });
    } catch {
      logoH = 0;
    }
  }

  const title = type === "driver" ? "GRUPPENRECHNUNG" : "RECHNUNG";
  drawRight(page, fontBold, title, width - margin, y - 8, 22, TEAL_DARK);

  const invoiceNo = invoiceNumberForJob(job);
  const invoiceDate = formatDeDate(new Date());
  const leistungDate = formatDeDate(job.pod_completed_at || job.preferred_pickup_at || job.created_at);
  const metaRight = width - margin;
  const metaLabelX = width - margin - 210;
  let metaY = y - 32;
  const meta = [
    ["Rechnungsnummer:", invoiceNo],
    ["Rechnungsdatum:", invoiceDate],
    ["Leistungsdatum:", leistungDate],
  ];
  for (const [k, v] of meta) {
    drawSafe(page, font, k, metaLabelX, metaY, 8, MUTED);
    drawRight(page, fontBold, v, metaRight, metaY, 8, TEXT);
    metaY -= 12;
  }

  drawSafe(page, font, "Transport & Logistik", margin, y - logoH - 12, 9, TEAL);
  y = Math.min(y - logoH - 22, metaY - 8);

  const colGap = 10;
  const colW = (contentW - colGap) / 2;
  const leftX = margin;
  const rightX = margin + colW + colGap;

  const addr = parseDeAddress(job.pickup_address || "");
  const plzOrt =
    addr.plzOrt ||
    (job.pickup_city ? `${job.pickup_city}` : "—");

  tealBar(page, leftX, y, colW, 16, "RECHNUNGSEMPFÄNGER", fontBold);
  tealBar(page, rightX, y, colW, 16, "RECHNUNGSAUSSTELLER", fontBold);
  y -= 22;

  const leftLines: [string, string][] = [
    ["Kundenname / Firma:", job.company_name || "—"],
    ["Straße Hausnummer:", addr.street || "—"],
    ["PLZ Ort:", plzOrt],
    ["", "Deutschland"],
    ["Kundennummer (optional):", job.order_number != null ? String(job.order_number) : ""],
  ];
  const rightLines: [string, string][] = [
    ["", PDF_COMPANY.name],
    ["", PDF_COMPANY.street],
    ["", `${PDF_COMPANY.postalCode} ${PDF_COMPANY.city}`],
    ["", PDF_COMPANY.country],
    ["Steuernummer:", PDF_COMPANY.taxNumber],
  ];

  const rowCount = Math.max(leftLines.length, rightLines.length);
  for (let i = 0; i < rowCount; i++) {
    const [ll, lv] = leftLines[i] ?? ["", ""];
    const [rl, rv] = rightLines[i] ?? ["", ""];
    if (ll) {
      drawSafe(page, font, ll, leftX, y, 8, MUTED);
      const lw = font.widthOfTextAtSize(sanitizeTextForStandardPdfFont(ll), 8);
      const valLines = wrapLines(lv, font, 8, colW - lw - 10);
      drawSafe(page, font, valLines[0] || "", leftX + lw + 6, y, 8, TEXT);
    } else if (lv) {
      drawSafe(page, font, lv, leftX, y, 8, TEXT);
    }
    if (rl) {
      drawSafe(page, font, rl, rightX, y, 8, MUTED);
      const lw = font.widthOfTextAtSize(sanitizeTextForStandardPdfFont(rl), 8);
      drawSafe(page, font, rv, rightX + lw + 6, y, 8, TEXT);
    } else if (rv) {
      drawSafe(page, font, rv, rightX, y, 8, TEXT);
    }
    y -= 12;
  }
  y -= 10;

  drawSafe(
    page,
    font,
    "Hiermit berechnen wir Ihnen folgende Transportdienstleistung:",
    margin,
    y,
    9
  );
  y -= 14;

  type LineItem = { pos: number; art: string; name: string; qty: string; unit: string; unitCents: number };
  const items: LineItem[] = [
    {
      pos: 1,
      art: "",
      name: type === "driver" ? "Fahrerleistung" : "Transportdienstleistung",
      qty: "1",
      unit: "Stück",
      unitCents: amountCents,
    },
  ];
  if (type === "driver" && hasAssistant) {
    items.push({
      pos: 2,
      art: "",
      name: "Helfer",
      qty: "1",
      unit: "Stück",
      unitCents: assistantCents,
    });
  }

  const cols = [
    { w: 32, align: "center" as const },
    { w: 52, align: "left" as const },
    { w: 188, align: "left" as const },
    { w: 48, align: "center" as const },
    { w: 50, align: "center" as const },
    { w: 72, align: "right" as const },
    { w: 73, align: "right" as const },
  ];
  const tableW = cols.reduce((s, c) => s + c.w, 0);
  const headers = ["Pos.", "Art.-Nr.", "Bezeichnung", "Anzahl", "Einheit", "Einzelpreis", "Gesamtpreis"];

  page.drawRectangle({ x: margin, y: y - 16, width: tableW, height: 16, color: TEAL });
  let hx = margin;
  headers.forEach((h, i) => {
    const c = cols[i];
    const tw = fontBold.widthOfTextAtSize(h, 7.5);
    const tx =
      c.align === "right" ? hx + c.w - 5 - tw : c.align === "center" ? hx + (c.w - tw) / 2 : hx + 4;
    drawSafe(page, fontBold, h, tx, y - 11, 7.5, WHITE);
    hx += c.w;
  });
  y -= 16;

  items.forEach((item, idx) => {
    const rowH = 22;
    page.drawRectangle({
      x: margin,
      y: y - rowH,
      width: tableW,
      height: rowH,
      color: idx % 2 === 0 ? ROW_BG : WHITE,
      borderColor: LINE,
      borderWidth: 0.5,
    });
    const cells = [
      String(item.pos),
      item.art,
      item.name,
      item.qty,
      item.unit,
      formatEur(item.unitCents),
      formatEur(item.unitCents),
    ];
    let cx = margin;
    cells.forEach((val, i) => {
      const c = cols[i];
      const f = i >= 5 ? fontBold : font;
      const safe = sanitizeTextForStandardPdfFont(val);
      const tw = f.widthOfTextAtSize(safe, 8);
      const tx =
        c.align === "right" ? cx + c.w - 5 - tw : c.align === "center" ? cx + (c.w - tw) / 2 : cx + 4;
      drawSafe(page, f, val, tx, y - 14, 8);
      cx += c.w;
    });
    y -= rowH;
  });

  const totalCents = type === "driver" && hasAssistant ? amountCents + assistantCents : amountCents;
  const sumW = 200;
  const sumX = margin + tableW - sumW;
  y -= 2;
  page.drawLine({
    start: { x: sumX, y },
    end: { x: margin + tableW, y },
    thickness: 1.2,
    color: TEAL,
  });
  y -= 16;
  drawSafe(page, fontBold, "Gesamtsumme", sumX + 8, y, 9, TEAL_DARK);
  drawRight(page, fontBold, formatEur(totalCents), margin + tableW - 4, y, 9, TEAL_DARK);
  page.drawLine({
    start: { x: sumX, y: y - 6 },
    end: { x: margin + tableW, y: y - 6 },
    thickness: 1.2,
    color: TEAL,
  });
  y -= 22;

  page.drawRectangle({
    x: margin,
    y: y - 22,
    width: contentW,
    height: 22,
    color: GREEN_BG,
  });
  drawSafe(
    page,
    font,
    "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.",
    margin + 8,
    y - 14,
    8,
    TEAL_DARK
  );
  y -= 34;

  tealBar(page, margin, y, contentW, 16, "ZAHLUNGSBEDINGUNGEN", fontBold);
  y -= 28;
  const payLines = wrapLines(
    "Bitte überweisen Sie den Gesamtbetrag innerhalb von 7 Tagen nach Rechnungserhalt auf das unten angegebene Konto.",
    font,
    8,
    contentW
  );
  for (const ln of payLines) {
    drawSafe(page, font, ln, margin, y, 8);
    y -= 11;
  }
  y -= 10;

  tealBar(page, leftX, y, colW, 16, "BANKVERBINDUNG", fontBold);
  tealBar(page, rightX, y, colW, 16, "KONTAKT", fontBold);
  y -= 20;
  const bankRows: [string, string][] = [
    ["Kontoinhaber:", PDF_COMPANY.legalOwner],
    ["Bank:", PDF_COMPANY.bankName],
    ["IBAN:", PDF_COMPANY.iban],
    ["BIC:", PDF_COMPANY.bic],
  ];
  const contactRows: [string, string][] = [
    ["E-Mail:", PDF_COMPANY.email],
    ["Telefon:", PDF_COMPANY.phone],
    ["Webseite:", "www.transpool24.com/de"],
  ];
  const pairN = Math.max(bankRows.length, contactRows.length);
  const blockTop = y;
  for (let i = 0; i < pairN; i++) {
    const rowY = blockTop - i * 12;
    if (bankRows[i]) {
      drawSafe(page, fontBold, bankRows[i][0], leftX, rowY, 8, MUTED);
      drawSafe(page, font, bankRows[i][1], leftX + 88, rowY, 8, TEXT);
    }
    if (contactRows[i]) {
      drawSafe(page, fontBold, contactRows[i][0], rightX, rowY, 8, MUTED);
      drawSafe(page, font, contactRows[i][1], rightX + 58, rowY, 8, TEXT);
    }
  }
  y = blockTop - pairN * 12 - 18;

  if (type === "customer") {
    const ps = job.payment_status;
    const payLabel =
      ps === "paid" ? "Bezahlt" : ps === "pending" ? "Ausstehend" : ps === "refunded" ? "Erstattet" : ps === "failed" ? "Fehlgeschlagen" : String(ps ?? "—");
    drawSafe(page, font, `Zahlungsstatus: ${payLabel}`, margin, y, 8, MUTED);
    y -= 16;
  }

  const thanksLines = wrapLines(
    "Vielen Dank für Ihr Vertrauen in TransPool24 - Ihr zuverlässiger Partner für Transport & Logistik.",
    font,
    8,
    contentW - 20
  );
  for (const ln of thanksLines) {
    drawCentered(page, font, ln, pageMid, y, 8, TEAL);
    y -= 12;
  }
  drawCentered(page, fontBold, "TransPool24  |  Transport & Logistik", pageMid, y, 8, TEAL_DARK);

  return doc.save();
}
