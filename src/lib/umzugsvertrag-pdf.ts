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
const LINE_GAP = 22;

function formatEur(cents: number): string {
  const n = (Math.round(cents) / 100).toFixed(2).replace(".", ",");
  return `${n} EUR`;
}

function asDate(iso: string | Date | null | undefined): Date | null {
  if (!iso) return null;
  const d = iso instanceof Date ? iso : new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDeDate(iso: string | Date | null | undefined): string {
  const d = asDate(iso);
  if (!d) return "-";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDeDateLong(iso: string | Date | null | undefined): string {
  const d = asDate(iso);
  if (!d) return "-";
  return d.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDeTime(iso: string | Date | null | undefined): string {
  const d = asDate(iso);
  if (!d) return "-";
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function formatDeDateTime(iso: string | Date | null | undefined): string {
  const d = asDate(iso);
  if (!d) return "-";
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
  drawSafe(page, fontBold, title, x + 10, yTop - h + 7, 9, WHITE);
}

function drawLabelValue(
  page: PDFPage,
  font: PDFFont,
  x: number,
  y: number,
  label: string,
  value: string,
  labelW: number,
  valueW: number
): number {
  if (label) drawSafe(page, font, label, x, y, 9, MUTED);
  const lines = wrapLines(value || "", font, 9, valueW).slice(0, 4);
  lines.forEach((ln, i) => {
    drawSafe(page, font, ln, x + (label ? labelW : 0), y - i * LINE_GAP, 9, TEXT);
  });
  return LINE_GAP * Math.max(1, lines.length || 1);
}

function vehicleForCargo(size: string | null | undefined): string {
  if (size === "L") return "3,5-t-Transporter mit Kofferaufbau und Ladebordwand/Hebebühne";
  if (size === "XS") return "Transporter (kompakt) mit Fahrer";
  return "Transporter mit Fahrer";
}

function cityLine(a: { city: string; postalCode: string }, fallback: string): string {
  const c = `${a.postalCode} ${a.city}`.trim();
  return c || fallback || "";
}

/**
 * Same invoice chrome (logo, teal bars, two columns) with the full
 * Auftragsbestätigung / Umzugsvertrag wording, filled from the job.
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
  const pageMid = width / 2;
  const colGap = 10;
  const colW = (contentW - colGap) / 2;
  const leftX = margin;
  const rightX = margin + colW + colGap;
  let y = height - 28;

  const auftrag = formatAuftragNumber(job);
  const sender = jobSenderAddress(job);
  const recipient = jobRecipientAddress(job);
  const customerName = pdfPrintableOrFallback(job.company_name, sender.company);
  const pickupAt = job.preferred_pickup_at;
  const deliveryAt = jobPreferredDeliveryAt(job);
  const workDate = pickupAt || job.created_at;
  const vat = splitGermanVatFromGross(job.price_cents ?? 0);
  const gross = formatEur(vat.grossCents);
  const vatAmt = formatEur(vat.vatCents);
  const pickupCity = cityLine(sender, job.pickup_city || "");
  const deliveryCity = cityLine(recipient, job.delivery_city || "");
  const km =
    job.distance_km != null && Number.isFinite(Number(job.distance_km))
      ? `${Number(job.distance_km).toFixed(0)} km`
      : "vereinbarte Strecke";
  const pickupAddr =
    formatStructuredAddressPlain(sender, false) || job.pickup_address || "-";
  const deliveryAddr =
    formatStructuredAddressPlain(recipient, false) || job.delivery_address || "-";
  const pickupHint = sender.notes.trim();
  const deliveryHint = recipient.notes.trim();

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

  drawRight(page, fontBold, "AUFTRAGSBESTÄTIGUNG", width - margin, y - 8, 16, TEAL);
  const metaRight = width - margin;
  const metaLabelX = width - margin - 210;
  let metaY = y - 32;
  const meta: [string, string][] = [
    ["Auftragsnummer:", auftrag],
    ["Datum:", formatDeDate(workDate)],
    ["Kundenname:", customerName],
    ["Abholzeit:", formatDeDateTime(pickupAt)],
    ["Lieferzeit:", formatDeDateTime(deliveryAt)],
  ];
  for (const [k, v] of meta) {
    drawSafe(page, font, k, metaLabelX, metaY, 9, MUTED);
    drawRight(page, fontBold, v, metaRight, metaY, 9, TEXT);
    metaY -= LINE_GAP;
  }

  drawSafe(page, font, "Transport & Logistik", margin, y - logoH - 14, 11, ORANGE);
  y = Math.min(y - logoH - 36, metaY - 14);

  const ensure = (need: number) => {
    if (y - need < 56) {
      page = doc.addPage(pageSize);
      y = height - 40;
    }
  };

  const section = (title: string) => {
    ensure(36);
    tealBar(page, margin, y, contentW, 20, title, fontBold);
    y -= 32;
  };

  const para = (text: string, size = 9) => {
    const lines = wrapLines(text, font, size, contentW);
    for (const ln of lines) {
      ensure(16);
      drawSafe(page, font, ln, margin, y, size, TEXT);
      y -= 13;
    }
  };

  const bullet = (text: string) => {
    const lines = wrapLines(text, font, 9, contentW - 16);
    lines.forEach((ln, i) => {
      ensure(16);
      drawSafe(page, font, i === 0 ? `*  ${ln}` : `   ${ln}`, margin, y, 9, TEXT);
      y -= 13;
    });
  };

  const subhead = (text: string) => {
    ensure(18);
    drawSafe(page, fontBold, text, margin, y, 9, TEAL);
    y -= 16;
  };

  tealBar(page, leftX, y, colW, 20, "AUFTRAGGEBER (KUNDE)", fontBold);
  tealBar(page, rightX, y, colW, 20, "AUFTRAGNEHMER", fontBold);
  y -= 32;

  const leftPairs: [string, string][] = [
    ["Name / Firma:", customerName],
    ["E-Mail:", job.customer_email || "-"],
    ["Telefon:", job.phone || sender.phone || "-"],
    ["Kundennummer:", job.order_number != null ? String(job.order_number) : "-"],
  ];
  const rightPairs: [string, string][] = [
    ["", PDF_COMPANY.name],
    ["Inhaber:", PDF_COMPANY.legalOwner],
    ["", PDF_COMPANY.street],
    ["", `${PDF_COMPANY.postalCode} ${PDF_COMPANY.city}`],
    ["Steuernummer:", PDF_COMPANY.taxNumber],
  ];
  for (let i = 0; i < Math.max(leftPairs.length, rightPairs.length); i++) {
    const lp = leftPairs[i] ?? ["", ""];
    const rp = rightPairs[i] ?? ["", ""];
    const h1 = drawLabelValue(page, font, leftX, y, lp[0], lp[1], 108, colW - 116);
    const h2 = drawLabelValue(page, font, rightX, y, rp[0], rp[1], 90, colW - 98);
    y -= Math.max(h1, h2) + 4;
  }
  y -= 10;

  section("1. TERMINE & ADRESSEN");
  bullet(`Umzugsdatum: ${formatDeDateLong(workDate)}`);
  bullet(`Arbeitsbeginn: ${pickupAt ? `${formatDeTime(pickupAt)} Uhr` : "-"}`);
  bullet(
    `Beladeadresse${pickupCity ? ` (${pickupCity})` : ""}: ${pickupAddr.replace(/\n/g, ", ")}${
      pickupHint ? ` (${pickupHint})` : ""
    }`
  );
  bullet(
    `Entladeadresse${deliveryCity ? ` (${deliveryCity})` : ""}: ${deliveryAddr.replace(/\n/g, ", ")}${
      deliveryHint ? ` (${deliveryHint})` : ""
    }`
  );
  y -= 8;

  section("2. LADUNG");
  para(`Größe: ${job.cargo_size || "-"}`);
  y -= 2;
  const cargo = formatCargoLoadsPlainDe(job.cargo_details);
  if (cargo) {
    for (const line of cargo.split("\n")) bullet(line);
  } else {
    bullet("Ladung laut Auftrag / Kundenangabe.");
  }
  y -= 8;

  section("3. VEREINBARTER LEISTUNGSUMFANG");
  para(`Fahrzeug: ${vehicleForCargo(job.cargo_size)}`);
  y -= 4;
  subhead("Enthaltene Leistungen:");
  if (job.service_type === "driver_only") {
    bullet("Fahrerleistung laut Auftrag (ohne Fahrzeugstellung durch TransPool24)");
  } else {
    bullet(
      `Fachgerechtes Beladen des Transportfahrzeugs${pickupCity ? ` in ${sender.city || pickupCity}` : ""}`
    );
    bullet(`Sichere Transportfahrt${deliveryCity ? ` nach ${recipient.city || deliveryCity}` : ""} (ca. ${km})`);
    bullet(
      `Entladen und Tragen der Möbelstücke und Kartons${deliveryHint ? ` (${deliveryHint})` : " am Lieferort"}`
    );
    bullet("Ladungssicherung (Spanngurte, Decken) während des Transports");
    if (job.service_type === "driver_car_assistant") {
      bullet("Helfer für Be- und Entladen laut Auftrag");
    }
  }
  y -= 4;
  subhead("Nicht enthaltene Leistungen:");
  bullet("Keine Demontage oder Montage von Möbeln/Küchen");
  bullet("Kein Ein- und Auspackservice, keine Entsorgung/Entrümpelung");
  bullet("Alle Möbelstücke müssen transportfertig demontiert und verpackt bereitstehen.");
  y -= 8;

  section("4. VERGÜTUNG & ZAHLUNGSBEDINGUNGEN");
  const tableW = contentW;
  page.drawRectangle({ x: margin, y: y - 22, width: tableW, height: 22, color: TEAL });
  drawSafe(page, fontBold, "Pos.", margin + 8, y - 14, 8, WHITE);
  drawSafe(page, fontBold, "Bezeichnung", margin + 44, y - 14, 8, WHITE);
  drawRight(page, fontBold, "Gesamtpreis", margin + tableW - 8, y - 14, 8, WHITE);
  y -= 22;
  page.drawRectangle({
    x: margin,
    y: y - 28,
    width: tableW,
    height: 28,
    color: ROW_BG,
    borderColor: LINE,
    borderWidth: 0.5,
  });
  drawSafe(page, font, "1", margin + 8, y - 18, 9);
  drawSafe(page, font, "Transportdienstleistung laut diesem Vertrag", margin + 44, y - 18, 9);
  drawRight(page, fontBold, formatEur(vat.netCents), margin + tableW - 8, y - 18, 9);
  y -= 40;
  drawSafe(page, font, "Netto", margin + tableW - 210, y, 9, MUTED);
  drawRight(page, font, formatEur(vat.netCents), margin + tableW - 4, y, 9);
  y -= 16;
  drawSafe(page, font, "zzgl. 19 % MwSt.", margin + tableW - 210, y, 9, MUTED);
  drawRight(page, font, vatAmt, margin + tableW - 4, y, 9);
  y -= 18;
  drawSafe(page, fontBold, "Vereinbarter Brutto-Festpreis", margin + tableW - 210, y, 10, TEAL);
  drawRight(page, fontBold, gross, margin + tableW - 4, y, 10, TEAL);
  y -= 22;
  para(
    "Zusatzkosten: Es entstehen am Umzugstag keine versteckten Zusatzkosten für die vereinbarten Leistungen und Güter laut Listung."
  );
  para(
    "Zahlungsbedingungen: Rechnungsstellung erfolgt direkt nach Durchführung. Der Rechnungsbetrag ist innerhalb von 7 Tagen nach Rechnungserhalt ohne Abzug per Überweisung fällig."
  );
  para(`Bankverbindung für die Überweisung: IBAN ${PDF_COMPANY.iban}`);
  y -= 8;

  section("5. HAFTUNG & VERSICHERUNG");
  para(
    "Es gilt die gesetzliche Haftung für Möbelspediteure nach § 451g HGB (Grundhaftung bis 620,00 EUR je Kubikmeter Rauminhalt)."
  );
  para(
    "Für bereits beschädigte Gegenstände sowie selbst verpackte Kartons wird keine Haftung für den Inhalt übernommen, sofern keine äußere Beschädigung des Kartons durch den Frachtführer vorliegt."
  );
  y -= 8;

  section(`6. NACHTRAG / KLARSTELLUNGEN (Stand: ${formatDeDate(new Date())})`);
  para(
    "Auf Rückfrage des Auftraggebers werden folgende Punkte zur Auftragsbestätigung verbindlich klargestellt:"
  );
  y -= 4;
  subhead("Fälligkeit & Leistungsdatum:");
  bullet(
    `Die Zahlung des vereinbarten Betrags von ${gross} erfolgt vereinbarungsgemäß unmittelbar nach vollständiger Durchführung am ${formatDeDate(workDate)} und nach Erhalt einer korrekten Rechnung. Ein davon abweichendes Leistungsdatum auf der Rechnung wird entsprechend korrigiert.`
  );
  subhead("Umsatzsteuer (§ 19 UStG):");
  bullet(
    `Der Festpreis von ${gross} gilt brutto. Auf der Rechnung werden die enthaltenen 19 % MwSt. (${vatAmt}) ausgewiesen. Der Festpreis bleibt unverändert bei ${gross}.`
  );
  subhead("Fahrzeugausstattung:");
  bullet(`Zum Einsatz kommt, wie vereinbart, ${vehicleForCargo(job.cargo_size)}.`);
  subhead("Geschäftsanschrift:");
  bullet(
    `Die verbindliche Anschrift des Auftragnehmers lautet: ${PDF_COMPANY.street}, ${PDF_COMPANY.postalCode} ${PDF_COMPANY.city}.`
  );
  subhead("Haftung & Verbraucherschutz (§§ 451e, 451g HGB):");
  bullet(
    "Es gilt die gesetzliche Haftungsgrenze von 620,00 EUR je Kubikmeter Rauminhalt gemäß § 451g HGB. Eine ordnungsgemäße Transportversicherung im Rahmen der geltenden Verbraucherschutzbestimmungen ist eingeschlossen."
  );
  y -= 10;

  ensure(90);
  tealBar(page, leftX, y, colW, 20, "BANKVERBINDUNG", fontBold);
  tealBar(page, rightX, y, colW, 20, "KONTAKT", fontBold);
  y -= 34;
  const bank: [string, string][] = [
    ["Kontoinhaber:", PDF_COMPANY.legalOwner],
    ["Bank:", PDF_COMPANY.bankName],
    ["IBAN:", PDF_COMPANY.iban],
    ["BIC:", PDF_COMPANY.bic],
  ];
  const contact: [string, string][] = [
    ["E-Mail:", PDF_COMPANY.email],
    ["Telefon:", PDF_COMPANY.invoicePhone],
    ["Webseite:", PDF_COMPANY.websiteUrl],
  ];
  for (let i = 0; i < 4; i++) {
    if (bank[i]) {
      drawLabelValue(page, font, leftX, y, bank[i][0], bank[i][1], 88, colW - 96);
    }
    if (contact[i]) {
      drawLabelValue(page, font, rightX, y, contact[i][0], contact[i][1], 58, colW - 66);
    }
    y -= LINE_GAP + 2;
  }
  y -= 16;

  ensure(88);
  drawSafe(page, font, `${PDF_COMPANY.city}, ${formatDeDate(workDate)}`, margin, y, 9, TEXT);
  y -= 12;
  drawSafe(page, font, "Ort, Datum", margin, y, 8, MUTED);
  y -= 28;
  page.drawLine({
    start: { x: margin, y },
    end: { x: margin + colW - 10, y },
    thickness: 0.8,
    color: LINE,
  });
  y -= 12;
  drawSafe(page, fontBold, PDF_COMPANY.legalOwner, margin, y, 9, TEXT);
  y -= 12;
  drawSafe(page, font, `Unterschrift / Bestätigung TransPool24 (${PDF_COMPANY.legalOwner})`, margin, y, 8, MUTED);
  y -= 28;
  page.drawLine({
    start: { x: margin, y },
    end: { x: margin + colW + 40, y },
    thickness: 0.8,
    color: LINE,
  });
  y -= 12;
  drawSafe(
    page,
    font,
    `Unterschrift / Bestätigung Auftraggeber (${customerName})`,
    margin,
    y,
    8,
    MUTED
  );

  ensure(52);
  y -= 22;
  const thanksLines = wrapLines(
    "Vielen Dank für Ihr Vertrauen in TransPool24 - Ihr zuverlässiger Partner für Transport & Logistik.",
    font,
    9,
    contentW - 20
  );
  for (const ln of thanksLines) {
    ensure(18);
    drawCentered(page, font, ln, pageMid, y, 9, TEAL);
    y -= 14;
  }
  y -= 8;
  drawCentered(page, fontBold, "TransPool24 · Transport & Logistik", pageMid, y, 9, TEAL);

  return doc.save();
}

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
