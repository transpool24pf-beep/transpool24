import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import type { Job } from "./supabase";
import { getPdfLogoBytes, PDF_COMPANY } from "./pdf-company";
import {
  formatStructuredAddressPlain,
  jobPreferredDeliveryAt,
  jobRecipientAddress,
  jobSenderAddress,
} from "./structured-address";
import { formatAuftragNumber } from "./order-ref";
import { splitGermanVatFromGross } from "./pricing";
import { formatCargoLoadsPlainDe } from "./cargo";
import { pdfPrintableOrFallback, sanitizeTextForStandardPdfFont } from "./invoice-pdf";

const TEAL = rgb(24 / 255, 63 / 255, 104 / 255);
const ORANGE = rgb(0.95, 0.48, 0.12);
const LINE = rgb(0.82, 0.86, 0.9);
const ROW_BG = rgb(0.94, 0.95, 0.97);
const TEXT = rgb(0.12, 0.14, 0.18);
const MUTED = rgb(0.32, 0.38, 0.42);
const WHITE = rgb(1, 1, 1);
const LINE_GAP = 14;

function formatEur(cents: number): string {
  const n = (Math.round(cents) / 100).toFixed(2).replace(".", ",");
  return `${n} EUR`;
}

function formatDeDate(iso: string | Date | null | undefined): string {
  if (!iso) return "-";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDeDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return "-";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const safe = sanitizeTextForStandardPdfFont(text);
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

function tealBar(page: PDFPage, x: number, yTop: number, w: number, h: number, title: string, fontBold: PDFFont) {
  page.drawRectangle({ x, y: yTop - h, width: w, height: h, color: TEAL });
  drawSafe(page, fontBold, title, x + 10, yTop - h + 6, 8, WHITE);
}

function vehicleForCargo(size: string | null | undefined): string {
  if (size === "L") return "3,5-t-Transporter (Kofferaufbau)";
  if (size === "XS") return "Transporter (kompakt)";
  return "Transporter mit Fahrer";
}

function serviceScope(job: Job): { included: string[]; excluded: string[] } {
  const km =
    job.distance_km != null && Number.isFinite(Number(job.distance_km))
      ? `${Number(job.distance_km).toFixed(1)} km`
      : "vereinbarte Strecke";
  const included = [
    "Fachgerechtes Beladen des Transportfahrzeugs",
    `Sichere Transportfahrt (${km})`,
    "Entladen am Lieferort",
    "Ladungssicherung (Spanngurte, Decken) während des Transports",
  ];
  if (job.service_type === "driver_car_assistant") {
    included.push("Helfer für Be- und Entladen laut Auftrag");
  }
  if (job.service_type === "driver_only") {
    return {
      included: ["Fahrerleistung laut Auftrag (ohne Fahrzeugstellung durch TransPool24)"],
      excluded: ["Kein eigenes Transportfahrzeug von TransPool24", "Keine Demontage oder Montage von Möbeln"],
    };
  }
  return {
    included,
    excluded: [
      "Keine Demontage oder Montage von Möbeln/Küchen",
      "Kein Ein- und Auspackservice, keine Entsorgung",
      "Gut muss transportfertig bereitstehen",
    ],
  };
}

/**
 * Customer moving/transport contract in the same layout as the customer invoice.
 */
export async function generateUmzugsvertragPdf(job: Job): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [595, 842];
  let page = doc.addPage(pageSize);
  const { width, height } = page.getSize();
  const margin = 40;
  const contentW = width - margin * 2;
  const colGap = 10;
  const colW = (contentW - colGap) / 2;
  const leftX = margin;
  const rightX = margin + colW + colGap;
  let y = height - 28;

  const logoBytes = await getPdfLogoBytes();
  let logoH = 0;
  if (logoBytes && logoBytes.length > 0) {
    try {
      let img;
      try {
        img = await doc.embedPng(logoBytes);
      } catch {
        img = await doc.embedJpg(logoBytes);
      }
      const imgW = 236;
      const imgH = Math.min(78, (img.height / img.width) * imgW);
      logoH = imgH;
      page.drawImage(img, { x: margin, y: y - imgH, width: imgW, height: imgH });
    } catch {
      logoH = 0;
    }
  }

  drawRight(page, fontBold, "UMZUGSVERTRAG", width - margin, y - 8, 18, TEAL);
  drawRight(page, font, "Auftragsbestätigung", width - margin, y - 26, 10, MUTED);

  const auftrag = formatAuftragNumber(job);
  const sender = jobSenderAddress(job);
  const recipient = jobRecipientAddress(job);
  const customerName = pdfPrintableOrFallback(job.company_name, sender.company);
  const pickupAt = job.preferred_pickup_at;
  const deliveryAt = jobPreferredDeliveryAt(job);
  const docDate = formatDeDate(pickupAt || job.created_at);
  const metaRight = width - margin;
  const metaLabelX = width - margin - 210;
  let metaY = y - 44;
  const meta: [string, string][] = [
    ["Auftragsnummer:", auftrag],
    ["Vertragsdatum:", docDate],
    ["Kundenname:", customerName],
    ["Abholung:", formatDeDateTime(pickupAt)],
    ["Lieferung:", formatDeDateTime(deliveryAt)],
  ];
  for (const [k, v] of meta) {
    drawSafe(page, font, k, metaLabelX, metaY, 8, MUTED);
    drawRight(page, fontBold, v, metaRight, metaY, 8, TEXT);
    metaY -= 13;
  }

  drawSafe(page, font, "Transport & Logistik", margin, y - logoH - 14, 11, ORANGE);
  y = Math.min(y - logoH - 36, metaY - 10);

  tealBar(page, leftX, y, colW, 18, "AUFTRAGGEBER (KUNDE)", fontBold);
  tealBar(page, rightX, y, colW, 18, "AUFTRAGNEHMER", fontBold);
  y -= 28;

  const customerRows: [string, string][] = [
    ["Name / Firma:", customerName],
    ["Telefon:", job.phone || sender.phone || "-"],
    ["E-Mail:", job.customer_email || "-"],
    ["Kundennummer:", job.order_number != null ? String(job.order_number) : "-"],
  ];
  const companyRows: [string, string][] = [
    ["", PDF_COMPANY.name],
    ["Inhaber:", PDF_COMPANY.legalOwner],
    ["", `${PDF_COMPANY.street}`],
    ["", `${PDF_COMPANY.postalCode} ${PDF_COMPANY.city}`],
    ["Steuernummer:", PDF_COMPANY.taxNumber],
  ];
  const rowN = Math.max(customerRows.length, companyRows.length);
  for (let i = 0; i < rowN; i++) {
    if (customerRows[i]) {
      drawSafe(page, font, customerRows[i][0], leftX, y, 8, MUTED);
      drawSafe(page, font, customerRows[i][1], leftX + 92, y, 8, TEXT);
    }
    if (companyRows[i]) {
      drawSafe(page, font, companyRows[i][0], rightX, y, 8, MUTED);
      drawSafe(page, font, companyRows[i][1], rightX + (companyRows[i][0] ? 88 : 0), y, 8, TEXT);
    }
    y -= 13;
  }
  y -= 10;

  const newPageIfNeeded = (need: number) => {
    if (y - need < 56) {
      page = doc.addPage(pageSize);
      y = height - 40;
    }
  };

  newPageIfNeeded(90);
  tealBar(page, margin, y, contentW, 18, "1. TERMINE & ADRESSEN", fontBold);
  y -= 28;
  const pickupPlain = formatStructuredAddressPlain(sender) || job.pickup_address || "-";
  const deliveryPlain = formatStructuredAddressPlain(recipient, "unload") || job.delivery_address || "-";
  const addrPairs: [string, string][] = [
    ["Umzugs- / Transportdatum:", formatDeDate(pickupAt || job.created_at)],
    ["Abholzeit:", formatDeDateTime(pickupAt)],
    ["Lieferzeit:", formatDeDateTime(deliveryAt)],
    ["Beladeadresse:", pickupPlain.replace(/\n/g, ", ")],
    ["Entladeadresse:", deliveryPlain.replace(/\n/g, ", ")],
  ];
  for (const [label, value] of addrPairs) {
    const lines = wrapLines(value, font, 8, contentW - 130);
    drawSafe(page, font, label, margin, y, 8, MUTED);
    lines.forEach((ln, i) => {
      drawSafe(page, font, ln, margin + 128, y - i * 11, 8, TEXT);
    });
    y -= 11 * Math.max(1, lines.length) + 4;
  }
  y -= 8;

  newPageIfNeeded(80);
  tealBar(page, margin, y, contentW, 18, "2. LADUNG (KUNDE)", fontBold);
  y -= 28;
  drawSafe(page, font, "Größe:", margin, y, 8, MUTED);
  drawSafe(page, fontBold, job.cargo_size || "-", margin + 70, y, 9, TEXT);
  y -= 16;
  const cargoText = formatCargoLoadsPlainDe(job.cargo_details);
  const cargoLines = cargoText
    ? cargoText.split("\n").flatMap((line) => wrapLines(line, font, 8, contentW))
    : wrapLines("Ladung laut Auftrag / Kundenangabe.", font, 8, contentW);
  for (const ln of cargoLines) {
    newPageIfNeeded(16);
    drawSafe(page, font, ln, margin, y, 8, TEXT);
    y -= 12;
  }
  y -= 8;

  newPageIfNeeded(100);
  tealBar(page, margin, y, contentW, 18, "3. LEISTUNGSUMFANG", fontBold);
  y -= 28;
  drawSafe(page, font, "Fahrzeug:", margin, y, 8, MUTED);
  drawSafe(page, font, vehicleForCargo(job.cargo_size), margin + 70, y, 8, TEXT);
  y -= 16;
  drawSafe(page, fontBold, "Enthaltene Leistungen:", margin, y, 8, TEAL);
  y -= 14;
  const scope = serviceScope(job);
  for (const item of scope.included) {
    newPageIfNeeded(14);
    drawSafe(page, font, `- ${item}`, margin, y, 8, TEXT);
    y -= 12;
  }
  y -= 4;
  drawSafe(page, fontBold, "Nicht enthalten:", margin, y, 8, TEAL);
  y -= 14;
  for (const item of scope.excluded) {
    newPageIfNeeded(14);
    drawSafe(page, font, `- ${item}`, margin, y, 8, TEXT);
    y -= 12;
  }
  y -= 8;

  newPageIfNeeded(110);
  tealBar(page, margin, y, contentW, 18, "4. VERGÜTUNG & ZAHLUNG", fontBold);
  y -= 28;
  const vat = splitGermanVatFromGross(job.price_cents ?? 0);
  const tableW = contentW;
  const cols = [
    { w: 36, h: "Pos." },
    { w: tableW - 36 - 90 - 90, h: "Bezeichnung" },
    { w: 90, h: "Einzelpreis" },
    { w: 90, h: "Gesamtpreis" },
  ];
  page.drawRectangle({ x: margin, y: y - 18, width: tableW, height: 18, color: TEAL });
  let hx = margin;
  cols.forEach((c) => {
    drawSafe(page, fontBold, c.h, hx + 4, y - 12, 7, WHITE);
    hx += c.w;
  });
  y -= 18;
  page.drawRectangle({
    x: margin,
    y: y - 22,
    width: tableW,
    height: 22,
    color: ROW_BG,
    borderColor: LINE,
    borderWidth: 0.4,
  });
  drawSafe(page, font, "1", margin + 8, y - 14, 8);
  drawSafe(page, font, "Transportdienstleistung laut diesem Vertrag", margin + 40, y - 14, 8);
  drawRight(page, font, formatEur(vat.netCents), margin + tableW - 94, y - 14, 8);
  drawRight(page, fontBold, formatEur(vat.netCents), margin + tableW - 6, y - 14, 8);
  y -= 36;
  drawSafe(page, font, "Netto", margin + tableW - 210, y, 8, MUTED);
  drawRight(page, font, formatEur(vat.netCents), margin + tableW - 4, y, 8);
  y -= 13;
  drawSafe(page, font, "zzgl. 19 % MwSt.", margin + tableW - 210, y, 8, MUTED);
  drawRight(page, font, formatEur(vat.vatCents), margin + tableW - 4, y, 8);
  y -= 15;
  drawSafe(page, fontBold, "Festpreis brutto", margin + tableW - 210, y, 9, TEAL);
  drawRight(page, fontBold, formatEur(vat.grossCents), margin + tableW - 4, y, 9, TEAL);
  y -= 20;
  for (const ln of wrapLines(
    "Rechnungsstellung erfolgt nach Durchführung. Der Betrag ist innerhalb von 7 Tagen nach Rechnungserhalt ohne Abzug per Überweisung fällig. Keine versteckten Zusatzkosten für die vereinbarten Leistungen und die oben genannte Ladung.",
    font,
    8,
    contentW
  )) {
    newPageIfNeeded(14);
    drawSafe(page, font, ln, margin, y, 8, TEXT);
    y -= 11;
  }
  y -= 8;

  newPageIfNeeded(90);
  tealBar(page, margin, y, contentW, 18, "5. HAFTUNG", fontBold);
  y -= 28;
  for (const ln of wrapLines(
    "Es gilt die gesetzliche Haftung für Möbelspediteure nach § 451g HGB (Grundhaftung bis 620,00 EUR je Kubikmeter Rauminhalt). Für bereits beschädigte Gegenstände sowie selbst verpackte Kartons wird keine Haftung für den Inhalt übernommen, sofern keine äußere Beschädigung des Kartons durch den Frachtführer vorliegt.",
    font,
    8,
    contentW
  )) {
    newPageIfNeeded(14);
    drawSafe(page, font, ln, margin, y, 8, TEXT);
    y -= 11;
  }
  y -= 12;

  newPageIfNeeded(70);
  tealBar(page, leftX, y, colW, 18, "BANKVERBINDUNG", fontBold);
  tealBar(page, rightX, y, colW, 18, "KONTAKT", fontBold);
  y -= 28;
  const bank = [
    ["Kontoinhaber:", PDF_COMPANY.legalOwner],
    ["Bank:", PDF_COMPANY.bankName],
    ["IBAN:", PDF_COMPANY.iban],
    ["BIC:", PDF_COMPANY.bic],
  ];
  const contact = [
    ["E-Mail:", PDF_COMPANY.email],
    ["Telefon:", PDF_COMPANY.invoicePhone],
    ["Webseite:", PDF_COMPANY.websiteUrl],
  ];
  for (let i = 0; i < 4; i++) {
    if (bank[i]) {
      drawSafe(page, font, bank[i][0], leftX, y, 8, MUTED);
      drawSafe(page, font, bank[i][1], leftX + 88, y, 8, TEXT);
    }
    if (contact[i]) {
      drawSafe(page, font, contact[i][0], rightX, y, 8, MUTED);
      drawSafe(page, font, contact[i][1], rightX + 58, y, 8, TEXT);
    }
    y -= 13;
  }
  y -= 18;

  newPageIfNeeded(70);
  drawSafe(
    page,
    font,
    `Pforzheim, ${docDate}                    Unterschriften:`,
    margin,
    y,
    8,
    MUTED
  );
  y -= 28;
  page.drawLine({
    start: { x: margin, y },
    end: { x: margin + colW - 8, y },
    thickness: 0.7,
    color: LINE,
  });
  page.drawLine({
    start: { x: rightX, y },
    end: { x: width - margin, y },
    thickness: 0.7,
    color: LINE,
  });
  y -= 12;
  drawSafe(page, font, `TransPool24 / ${PDF_COMPANY.legalOwner}`, margin, y, 7, MUTED);
  drawSafe(page, font, `Auftraggeber / ${customerName}`, rightX, y, 7, MUTED);

  return doc.save();
}

/** Invoice first, then Umzugsvertrag — one file for download; callers can also attach separately. */
export async function mergeInvoiceAndVertrag(
  invoicePdf: Uint8Array,
  vertragPdf: Uint8Array
): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  const a = await PDFDocument.load(invoicePdf);
  const b = await PDFDocument.load(vertragPdf);
  for (const p of await merged.copyPages(a, a.getPageIndices())) merged.addPage(p);
  for (const p of await merged.copyPages(b, b.getPageIndices())) merged.addPage(p);
  return merged.save();
}
