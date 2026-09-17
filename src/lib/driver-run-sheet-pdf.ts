import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import type { Job } from "./supabase";
import { getPdfLogoBytes, PDF_COMPANY } from "./pdf-company";
import { sanitizeTextForStandardPdfFont, pdfPrintableOrFallback } from "./invoice-pdf";
import { formatAuftragNumber } from "./order-ref";
import { cargoCategoryLabelDe, formatCargoLoadsPlainDe, parseCargoLoads, summarizeCargoLoads } from "./cargo";
import { jobPreferredDeliveryAt, jobRecipientAddress, jobSenderAddress, type StructuredAddress } from "./structured-address";

const TEAL = rgb(24 / 255, 63 / 255, 104 / 255);
const ORANGE = rgb(0.95, 0.48, 0.12);
const LINE = rgb(0.82, 0.86, 0.90);
const ROW_BG = rgb(0.94, 0.95, 0.97);
const TEXT = rgb(0.12, 0.14, 0.18);
const MUTED = rgb(0.32, 0.38, 0.42);
const WHITE = rgb(1, 1, 1);
const LINE_GAP = 16;

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const safe = sanitizeTextForStandardPdfFont(text, 2400);
  if (!safe) return [""];
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
  color = TEXT,
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
  color = TEXT,
): void {
  const safe = sanitizeTextForStandardPdfFont(text);
  const w = font.widthOfTextAtSize(safe, size);
  page.drawText(safe, { x: right - w, y, size, font, color });
}

function tealBar(page: PDFPage, x: number, yTop: number, w: number, h: number, title: string, fontBold: PDFFont) {
  page.drawRectangle({ x, y: yTop - h, width: w, height: h, color: TEAL });
  drawSafe(page, fontBold, title, x + 10, yTop - h + 6, 9, WHITE);
}

function formatDeDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return "-";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

function formatDeDate(iso: string | Date | null | undefined): string {
  if (!iso) return "-";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function streetLine(a: StructuredAddress, fallback: string): string {
  const s = `${a.street} ${a.houseNumber}`.trim();
  return s || fallback || "-";
}

function plzOrt(a: StructuredAddress, fallbackCity: string | null): string {
  const p = `${a.postalCode} ${a.city}`.trim();
  if (p) return p;
  return fallbackCity || "-";
}

function cargoRows(job: Job): [string, string][] {
  const cd = (job.cargo_details ?? null) as Record<string, unknown> | null;
  const rows: [string, string][] = [["Ladung (Groesse):", job.cargo_size || "-"]];
  const loads = formatCargoLoadsPlainDe(cd).trim();
  if (loads) {
    rows.push(["Ladung (Loads):", loads.replace(/\n/g, " | ")]);
  } else {
    const cat = cd && typeof cd.cargoCategory === "string" ? cd.cargoCategory : "";
    if (cat) rows.push(["Warenkategorie:", cargoCategoryLabelDe(cat)]);
    const weight =
      cd && typeof cd.weightKg === "number"
        ? cd.weightKg
        : cd && typeof cd.cargoWeightKg === "number"
          ? cd.cargoWeightKg
          : null;
    if (weight != null) rows.push(["Gewicht:", `${weight} kg`]);
    const pkg = cd && typeof cd.packageCount === "number" ? cd.packageCount : null;
    if (pkg != null) rows.push(["Pakete / Stueck:", String(pkg)]);
  }
  const parsed = parseCargoLoads(cd);
  if (parsed.length > 0) {
    const n = summarizeCargoLoads(parsed).packageCount;
    if (n > 0 && !rows.some((r) => r[0].startsWith("Pakete"))) {
      rows.push(["Pakete / Stueck:", String(n)]);
    }
  }
  rows.push(["Distanz:", job.distance_km != null ? `${String(job.distance_km).replace(".", ",")} km` : "-"]);
  return rows;
}

function drawPairColumn(
  page: PDFPage,
  font: PDFFont,
  x: number,
  y: number,
  pairs: [string, string][],
  colW: number,
): number {
  const labelW = 108;
  const valueW = colW - labelW - 8;
  let yy = y;
  for (const [label, value] of pairs) {
    if (label) drawSafe(page, font, label, x, yy, 8, MUTED);
    const lines = wrapLines(value || "-", font, 9, valueW).slice(0, 6);
    lines.forEach((ln, i) => {
      drawSafe(page, font, ln, x + (label ? labelW : 0), yy - i * LINE_GAP, 9, TEXT);
    });
    yy -= LINE_GAP * Math.max(1, lines.length) + 4;
  }
  return yy;
}

export async function generateDriverRunSheetPdf(job: Job): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const margin = 40;
  const contentW = width - margin * 2;
  let y = height - 28;

  const logoBytes = await getPdfLogoBytes();
  let logoH = 0;
  if (logoBytes && logoBytes.length > 0) {
    try {
      const img = await (async () => {
        try {
          return await doc.embedPng(logoBytes);
        } catch {
          return await doc.embedJpg(logoBytes);
        }
      })();
      const imgW = 236;
      const imgH = Math.min(78, (img.height / img.width) * imgW);
      logoH = imgH;
      page.drawImage(img, { x: margin, y: y - imgH, width: imgW, height: imgH });
    } catch {
      logoH = 0;
    }
  }

  drawRight(page, fontBold, "FAHRERBLATT", width - margin, y - 8, 22, TEAL);

  const auftrag = formatAuftragNumber(job);
  const metaRight = width - margin;
  const metaLabelX = width - margin - 210;
  let metaY = y - 32;
  const meta: [string, string][] = [
    ["Auftrag-Nr.:", auftrag],
    ["Datum:", formatDeDate(job.created_at)],
    ["Abholzeit:", formatDeDateTime(job.preferred_pickup_at)],
    ["Lieferzeit:", formatDeDateTime(jobPreferredDeliveryAt(job))],
  ];
  for (const [k, v] of meta) {
    drawSafe(page, font, k, metaLabelX, metaY, 9, MUTED);
    drawRight(page, fontBold, v, metaRight, metaY, 9, TEXT);
    metaY -= LINE_GAP;
  }

  drawSafe(page, font, "Transport & Logistik", margin, y - logoH - 14, 11, ORANGE);
  let companyY = y - logoH - 32;
  const companyLines = [
    PDF_COMPANY.name,
    `${PDF_COMPANY.legalOwner} (${PDF_COMPANY.legalForm})`,
    PDF_COMPANY.street,
    `${PDF_COMPANY.postalCode} ${PDF_COMPANY.city}`,
    `Tel: ${PDF_COMPANY.phone}`,
    `E-Mail: ${PDF_COMPANY.email}`,
    PDF_COMPANY.website,
  ];
  for (const line of companyLines) {
    drawSafe(page, font, line, margin, companyY, 8, TEXT);
    companyY -= 12;
  }

  y = Math.min(companyY - 10, metaY - 18);

  const colGap = 10;
  const colW = (contentW - colGap) / 2;
  const leftX = margin;
  const rightX = margin + colW + colGap;
  const pickup = jobSenderAddress(job);
  const drop = jobRecipientAddress(job);

  tealBar(page, leftX, y, colW, 20, "ABHOLUNG", fontBold);
  tealBar(page, rightX, y, colW, 20, "ZUSTELLUNG", fontBold);
  y -= 32;

  const leftAddr: [string, string][] = [
    ["Name / Firma:", pdfPrintableOrFallback(pickup.company, job.company_name)],
    ["Straße Hausnummer:", streetLine(pickup, job.pickup_address)],
    ["PLZ Ort:", plzOrt(pickup, job.pickup_city)],
    ["", pickup.country || "Deutschland"],
  ];
  if (pickup.notes.trim()) leftAddr.push(["Hinweis Ladestelle:", pickup.notes]);

  const rightAddr: [string, string][] = [
    ["Name / Firma:", pdfPrintableOrFallback(drop.company, job.company_name)],
    ["Telefon Empfaenger:", drop.phone || "-"],
    ["Straße Hausnummer:", streetLine(drop, job.delivery_address)],
    ["PLZ Ort:", plzOrt(drop, job.delivery_city)],
    ["", drop.country || "Deutschland"],
  ];
  if (drop.notes.trim()) rightAddr.push(["Hinweis Entladung:", drop.notes]);

  const yLeft = drawPairColumn(page, font, leftX, y, leftAddr, colW);
  const yRight = drawPairColumn(page, font, rightX, y, rightAddr, colW);
  y = Math.min(yLeft, yRight) - 16;

  tealBar(page, margin, y, contentW, 20, "KUNDENDATEN UND AUFTRAG", fontBold);
  y -= 28;

  const detailRows: [string, string][] = [
    ["Kundenname / Firma:", pdfPrintableOrFallback(job.company_name, pickup.company)],
    ["Telefon / WhatsApp:", job.phone || "-"],
    ["E-Mail:", job.customer_email || "-"],
    ...cargoRows(job),
  ];

  const tableX = margin;
  const tableW = contentW;
  const labelCol = 150;
  for (let i = 0; i < detailRows.length; i++) {
    const [label, value] = detailRows[i]!;
    const valueLines = wrapLines(value, font, 9, tableW - labelCol - 16);
    const rowH = 10 + LINE_GAP * valueLines.length;
    if (y - rowH < 36) break;
    if (i % 2 === 0) {
      page.drawRectangle({ x: tableX, y: y - rowH + 6, width: tableW, height: rowH, color: ROW_BG });
    }
    page.drawLine({
      start: { x: tableX, y: y - rowH + 6 },
      end: { x: tableX + tableW, y: y - rowH + 6 },
      thickness: 0.4,
      color: LINE,
    });
    drawSafe(page, font, label, tableX + 8, y - 6, 8, MUTED);
    valueLines.forEach((ln, li) => {
      drawSafe(page, font, ln, tableX + labelCol, y - 6 - li * LINE_GAP, 9, TEXT);
    });
    y -= rowH;
  }

  drawSafe(
    page,
    font,
    `${PDF_COMPANY.name}  |  ${PDF_COMPANY.addressLine}  |  Steuernr. ${PDF_COMPANY.taxNumber}`,
    margin,
    28,
    7,
    MUTED,
  );

  return doc.save();
}
