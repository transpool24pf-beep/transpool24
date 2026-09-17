import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import type { Job } from "./supabase";
import { getPdfLogoBytes, PDF_COMPANY } from "./pdf-company";
import { sanitizeTextForStandardPdfFont } from "./invoice-pdf";
import { formatAuftragNumber, formatSendungNumber } from "./order-ref";
import { formatCargoLoadsPlainDe, parseCargoLoads, summarizeCargoLoads } from "./cargo";
import { formatStructuredAddressPlain, jobRecipientAddress, jobSenderAddress } from "./structured-address";

const NAVY = rgb(13 / 255, 33 / 255, 55 / 255);
const ORANGE = rgb(0.91, 0.36, 0.02);
const MUTED = rgb(0.32, 0.38, 0.42);
const LINE = rgb(0.82, 0.86, 0.90);
const BOX = rgb(0.96, 0.97, 0.98);
const WHITE = rgb(1, 1, 1);

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const safe = sanitizeTextForStandardPdfFont(text, 2000);
  if (!safe) return ["-"];
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
  return lines.length ? lines : ["-"];
}

function drawLabelValue(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
): number {
  page.drawText(sanitizeTextForStandardPdfFont(label), {
    x,
    y,
    size: 8,
    font: fontBold,
    color: MUTED,
  });
  y -= 14;
  const lines = wrapLines(value, font, 11, width);
  for (const line of lines) {
    page.drawText(line, { x, y, size: 11, font, color: NAVY });
    y -= 15;
  }
  return y;
}

function packageCountForJob(job: Job): string {
  const cd = (job.cargo_details ?? null) as Record<string, unknown> | null;
  const loads = parseCargoLoads(cd);
  if (loads.length > 0) {
    const n = summarizeCargoLoads(loads).packageCount;
    return n > 0 ? String(n) : "-";
  }
  const n = cd && typeof cd.packageCount === "number" ? cd.packageCount : null;
  return n != null && n > 0 ? String(n) : "-";
}

function cargoWhatForJob(job: Job): string {
  const cd = (job.cargo_details ?? null) as Record<string, unknown> | null;
  const loads = formatCargoLoadsPlainDe(cd);
  if (loads.trim()) return loads;
  const parts = [job.cargo_size].filter(Boolean);
  if (cd && typeof cd.cargoCategory === "string" && cd.cargoCategory) parts.push(String(cd.cargoCategory));
  const w = cd && (typeof cd.weightKg === "number" ? cd.weightKg : typeof cd.cargoWeightKg === "number" ? cd.cargoWeightKg : null);
  if (w != null) parts.push(`${w} kg`);
  return parts.filter(Boolean).join(" · ") || "-";
}

function whenForJob(job: Job): string {
  if (job.preferred_pickup_at) {
    const d = new Date(job.preferred_pickup_at);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
    }
  }
  return "-";
}

export async function generateDriverRunSheetPdf(job: Job): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - 28;

  page.drawRectangle({ x: 0, y: height - 72, width, height: 72, color: NAVY });

  const logoBytes = await getPdfLogoBytes();
  if (logoBytes && logoBytes.length > 0) {
    try {
      const img = await doc.embedPng(logoBytes);
      const h = 40;
      const w = (img.width / img.height) * h;
      page.drawImage(img, { x: margin, y: height - 56, width: Math.min(w, 160), height: h });
    } catch {
      page.drawText("TransPool24", { x: margin, y: height - 48, size: 16, font: fontBold, color: WHITE });
    }
  } else {
    page.drawText("TransPool24", { x: margin, y: height - 48, size: 16, font: fontBold, color: WHITE });
  }

  page.drawText("Fahrerblatt / Lieferschein", {
    x: width - margin - 220,
    y: height - 42,
    size: 12,
    font: fontBold,
    color: WHITE,
  });
  page.drawText("Bitte dem Kunden aushaendigen + Kopie behalten", {
    x: width - margin - 220,
    y: height - 58,
    size: 8,
    font,
    color: rgb(0.85, 0.88, 0.92),
  });

  y = height - 92;
  const auftrag = formatAuftragNumber(job);
  const sendung = formatSendungNumber(job);

  page.drawRectangle({ x: margin, y: y - 46, width: width - margin * 2, height: 52, color: BOX, borderColor: ORANGE, borderWidth: 1.5 });
  page.drawText("Auftrag-Nr.", { x: margin + 12, y: y - 8, size: 8, font: fontBold, color: MUTED });
  page.drawText(sanitizeTextForStandardPdfFont(auftrag), {
    x: margin + 12,
    y: y - 28,
    size: 18,
    font: fontBold,
    color: NAVY,
  });
  page.drawText("Sendung-Nr.", { x: width / 2 + 8, y: y - 8, size: 8, font: fontBold, color: MUTED });
  page.drawText(sanitizeTextForStandardPdfFont(sendung), {
    x: width / 2 + 8,
    y: y - 28,
    size: 18,
    font: fontBold,
    color: NAVY,
  });

  y -= 72;
  const pickup = formatStructuredAddressPlain(jobSenderAddress(job)) || job.pickup_address || "-";
  const drop = formatStructuredAddressPlain(jobRecipientAddress(job)) || job.delivery_address || "-";
  const colW = (width - margin * 2 - 12) / 2;

  page.drawRectangle({ x: margin, y: y - 118, width: colW, height: 126, color: BOX, borderColor: LINE, borderWidth: 1 });
  page.drawText("1. Wohin?  ABHOLUNG", { x: margin + 10, y: y - 14, size: 9, font: fontBold, color: ORANGE });
  {
    let ty = y - 32;
    for (const line of wrapLines(pickup, font, 10, colW - 20).slice(0, 6)) {
      page.drawText(line, { x: margin + 10, y: ty, size: 10, font, color: NAVY });
      ty -= 13;
    }
  }

  page.drawRectangle({
    x: margin + colW + 12,
    y: y - 118,
    width: colW,
    height: 126,
    color: BOX,
    borderColor: LINE,
    borderWidth: 1,
  });
  page.drawText("5. Zustellung  ZIEL", {
    x: margin + colW + 22,
    y: y - 14,
    size: 9,
    font: fontBold,
    color: ORANGE,
  });
  {
    let ty = y - 32;
    for (const line of wrapLines(drop, font, 10, colW - 20).slice(0, 6)) {
      page.drawText(line, { x: margin + colW + 22, y: ty, size: 10, font, color: NAVY });
      ty -= 13;
    }
  }

  y -= 140;
  y = drawLabelValue(page, font, fontBold, "2. Wann? (Abholung)", whenForJob(job), margin, y, width - margin * 2);
  y -= 8;
  y = drawLabelValue(page, font, fontBold, "Kunde / Name", job.company_name || "-", margin, y, width - margin * 2);
  y -= 8;
  y = drawLabelValue(page, font, fontBold, "Telefon", job.phone || "-", margin, y, width - margin * 2);
  y -= 8;
  y = drawLabelValue(page, font, fontBold, "3. Was abholen?", cargoWhatForJob(job), margin, y, width - margin * 2);
  y -= 8;
  y = drawLabelValue(page, font, fontBold, "4. Anzahl der Packstuecke / Pakete", packageCountForJob(job), margin, y, 200);

  y -= 16;
  page.drawRectangle({ x: margin, y: y - 90, width: width - margin * 2, height: 96, color: WHITE, borderColor: LINE, borderWidth: 1 });
  page.drawText("Quittung Empfaenger (Unterschrift / Datum)", {
    x: margin + 10,
    y: y - 14,
    size: 9,
    font: fontBold,
    color: MUTED,
  });
  page.drawText("Name: ____________________________    Unterschrift: ____________________    Datum: __________", {
    x: margin + 10,
    y: y - 48,
    size: 9,
    font,
    color: NAVY,
  });

  page.drawText(
    sanitizeTextForStandardPdfFont(
      `${PDF_COMPANY.name}  |  ${PDF_COMPANY.addressLine}  |  ${PDF_COMPANY.phone}  |  ${PDF_COMPANY.website}`,
    ),
    { x: margin, y: 28, size: 7, font, color: MUTED },
  );

  return doc.save();
}
