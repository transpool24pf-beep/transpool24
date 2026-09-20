import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import type { Job } from "./supabase";
import { getPdfLogoBytes, PDF_COMPANY } from "./pdf-company";
import { jobPreferredDeliveryAt, jobRecipientAddress, jobSenderAddress } from "./structured-address";
import { formatAuftragNumber, formatKundennummer } from "./order-ref";
import { splitGermanVatFromGross } from "./pricing";

export type InvoiceType = "customer" | "driver";

/** Header fill from Numbers Vorlage (BANKVERBINDUNG bar / selected navy). */
const TEAL = rgb(24 / 255, 63 / 255, 104 / 255);
const TEAL_DARK = rgb(24 / 255, 63 / 255, 104 / 255);
const ORANGE = rgb(0.95, 0.48, 0.12);
const LINE = rgb(0.82, 0.86, 0.90);
const ROW_BG = rgb(0.94, 0.95, 0.97);
const GREEN_BG = rgb(0.89, 0.96, 0.89);
const TEXT = rgb(0.12, 0.14, 0.18);
const MUTED = rgb(0.32, 0.38, 0.42);
const WHITE = rgb(1, 1, 1);
const LINE_GAP = 22;

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
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, "*")
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, "*");
}

/** Helvetica cannot draw Arabic; use a Latin fallback (order company name) instead of ???. */
export function pdfPrintableOrFallback(
  value: string | null | undefined,
  fallback: string | null | undefined,
): string {
  const keep = (raw: string) =>
    sanitizeTextForStandardPdfFont(raw.trim()).replace(/\?/g, "").replace(/\s+/g, " ").trim();
  return keep(value ?? "") || keep(fallback ?? "") || "-";
}

function formatEur(cents: number): string {
  const n = (Math.round(cents) / 100).toFixed(2).replace(".", ",");
  return `${n} EUR`;
}

function ymdFromValue(value: string | Date | null | undefined): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value !== "string" || !value.trim()) return "";
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

export function formatDeDateYmd(ymd: string): string {
  const m = ymd.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "-";
  return `${m[3]}.${m[2]}.${m[1]}`;
}

function printedInvoiceYmd(job: Job): string {
  const raw =
    job.cargo_details && typeof job.cargo_details === "object"
      ? (job.cargo_details as Record<string, unknown>).printedInvoiceDate
      : null;
  if (typeof raw === "string") {
    const ymd = ymdFromValue(raw);
    if (ymd) return ymd;
  }
  return "";
}

function formatDeDate(iso: string | Date | null | undefined): string {
  const ymd = ymdFromValue(iso);
  if (ymd) return formatDeDateYmd(ymd);
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

export function invoiceNumberForJob(job: Job & { order_number?: number | null }): string {
  return formatAuftragNumber(job);
}

function streetHouse(street: string, houseNumber: string): string {
  return `${street} ${houseNumber}`.trim();
}

/** Line-item text: route, date, and Auftragsnummer as on the confirmation. */
export function customerInvoiceServiceName(job: Job): string {
  const sender = jobSenderAddress(job);
  const dest = jobRecipientAddress(job);
  const fromCity = (sender.city || job.pickup_city || "").trim();
  const fromStreet = streetHouse(sender.street, sender.houseNumber);
  const toCity = (dest.city || job.delivery_city || "").trim();
  const date = formatDeDate(job.preferred_pickup_at || job.created_at);
  const nr = formatAuftragNumber(job);
  const fromPart =
    fromCity && fromStreet ? `${fromCity} (${fromStreet})` : fromCity || fromStreet || "Abholort";
  const toPart = toCity || "Lieferort";
  const datePart = date !== "-" ? ` am ${date}` : "";
  return `Umzugsservice von ${fromPart} nach ${toPart}${datePart} (gemäß Auftragsbestätigung Nr. ${nr})`;
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

function drawLabelValue(
  page: PDFPage,
  font: PDFFont,
  _fontBold: PDFFont,
  x: number,
  y: number,
  label: string,
  value: string,
  labelW: number,
  valueW: number
): number {
  if (label) drawSafe(page, font, label, x, y, 9, MUTED);
  const lines = wrapLines(value || "", font, 8, valueW);
  const shown = lines.slice(0, 3);
  shown.forEach((ln, i) => {
    drawSafe(page, font, ln, x + (label ? labelW : 0), y - i * LINE_GAP, 9, TEXT);
  });
  return LINE_GAP * Math.max(1, shown.length || 1);
}

function tealBar(page: PDFPage, x: number, yTop: number, w: number, h: number, title: string, fontBold: PDFFont) {
  page.drawRectangle({ x, y: yTop - h, width: w, height: h, color: TEAL });
  drawSafe(page, fontBold, title, x + 10, yTop - h + 7, 9, WHITE);
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
      const imgW = 236;
      const imgH = Math.min(78, (img.height / img.width) * imgW);
      logoH = imgH;
      page.drawImage(img, { x: margin, y: y - imgH, width: imgW, height: imgH });
    } catch {
      logoH = 0;
    }
  }

  const title = type === "driver" ? "GRUPPENRECHNUNG" : "RECHNUNG";
  drawRight(page, fontBold, title, width - margin, y - 8, 22, TEAL_DARK);

  const invoiceNo = invoiceNumberForJob(job);
  const enteredInvoiceYmd = printedInvoiceYmd(job);
  const invoiceDate = enteredInvoiceYmd
    ? formatDeDateYmd(enteredInvoiceYmd)
    : formatDeDate(new Date());
  const leistungDate = formatDeDate(
    enteredInvoiceYmd || job.pod_completed_at || job.preferred_pickup_at || job.created_at
  );
  const metaRight = width - margin;
  const metaLabelX = width - margin - 210;
  let metaY = y - 32;
  const meta = [
    ["Rechnungsnummer:", invoiceNo],
    ["Rechnungsdatum:", invoiceDate],
    ["Leistungsdatum:", leistungDate],
    ["Abholzeit:", formatDeDateTime(job.preferred_pickup_at)],
    ["Lieferzeit:", formatDeDateTime(jobPreferredDeliveryAt(job))],
  ];
  for (const [k, v] of meta) {
    drawSafe(page, font, k, metaLabelX, metaY, 9, MUTED);
    drawRight(page, fontBold, v, metaRight, metaY, 9, TEXT);
    metaY -= LINE_GAP;
  }

  drawSafe(page, font, "Transport & Logistik", margin, y - logoH - 14, 11, ORANGE);
  y = Math.min(y - logoH - 36, metaY - 14);

  const colGap = 10;
  const colW = (contentW - colGap) / 2;
  const leftX = margin;
  const rightX = margin + colW + colGap;

  const billing = jobSenderAddress(job);
  const delivery = jobRecipientAddress(job);
  const addrStreet =
    streetHouse(billing.street, billing.houseNumber) || parseDeAddress(job.pickup_address || "").street;
  const plzOrt =
    `${billing.postalCode} ${billing.city}`.trim() ||
    parseDeAddress(job.pickup_address || "").plzOrt ||
    (job.pickup_city ? `${job.pickup_city}` : "-");
  const deliveryStreet = streetHouse(delivery.street, delivery.houseNumber);
  const deliveryPlzOrt = `${delivery.postalCode} ${delivery.city}`.trim();
  const showDelivery =
    Boolean(deliveryStreet || deliveryPlzOrt) &&
    (deliveryStreet !== addrStreet || deliveryPlzOrt !== plzOrt);

  tealBar(page, leftX, y, colW, 20, "RECHNUNGSEMPFÄNGER", fontBold);
  tealBar(page, rightX, y, colW, 20, "RECHNUNGSAUSSTELLER", fontBold);
  y -= 32;

  const labelW = 118;
  const valueW = colW - labelW - 8;
  const leftPairs: [string, string][] = [
    ["Kundenname / Firma:", pdfPrintableOrFallback(billing.company, job.company_name)],
    ["Telefon Empfaenger:", billing.phone || job.phone || ""],
    ["Straße Hausnummer:", addrStreet],
    ["PLZ Ort:", plzOrt],
    ["", billing.country || "Deutschland"],
  ];
  if (showDelivery) {
    leftPairs.push(["Lieferadresse:", deliveryStreet || "-"]);
    leftPairs.push(["PLZ Ort Lieferung:", deliveryPlzOrt || "-"]);
  }
  leftPairs.push(["Kundennummer (optional):", formatKundennummer(job) === "-" ? "" : formatKundennummer(job)]);
  if (delivery.notes.trim()) {
    leftPairs.push(["Hinweis Entladung:", delivery.notes]);
  }
  const rightPairs: [string, string][] = [
    ["", PDF_COMPANY.name],
    ["", PDF_COMPANY.street],
    ["", `${PDF_COMPANY.postalCode} ${PDF_COMPANY.city}`],
    ["", PDF_COMPANY.country],
    ["Steuernummer:", PDF_COMPANY.taxNumber],
  ];
  for (let i = 0; i < leftPairs.length; i++) {
    const h1 = drawLabelValue(page, font, fontBold, leftX, y, leftPairs[i][0], leftPairs[i][1], labelW, valueW);
    const rp = rightPairs[i] ?? ["", ""];
    const h2 = drawLabelValue(page, font, fontBold, rightX, y, rp[0], rp[1], 90, colW - 98);
    y -= Math.max(h1, h2) + 6;
  }
  y -= 20;

  drawSafe(
    page,
    font,
    "Hiermit berechnen wir Ihnen folgende Transportdienstleistung:",
    margin,
    y,
    10
  );
  y -= 24;

  type LineItem = { pos: number; art: string; name: string; qty: string; unit: string; unitCents: number };
  const totalCents = type === "driver" && hasAssistant ? amountCents + assistantCents : amountCents;
  const customerVat = type === "driver" ? null : splitGermanVatFromGross(totalCents);
  const items: LineItem[] = [
    {
      pos: 1,
      art: "",
      name: type === "driver" ? "Fahrerleistung" : customerInvoiceServiceName(job),
      qty: "1",
      unit: "Stück",
      unitCents: customerVat ? customerVat.netCents : amountCents,
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
    { w: 28, align: "center" as const },
    { w: 42, align: "left" as const },
    { w: 228, align: "left" as const },
    { w: 42, align: "center" as const },
    { w: 46, align: "center" as const },
    { w: 64, align: "right" as const },
    { w: 65, align: "right" as const },
  ];
  const tableW = cols.reduce((s, c) => s + c.w, 0);
  const headers = ["Pos.", "Art.-Nr.", "Bezeichnung", "Anzahl", "Einheit", "Einzelpreis", "Gesamtpreis"];

  page.drawRectangle({ x: margin, y: y - 22, width: tableW, height: 22, color: TEAL });
  let hx = margin;
  headers.forEach((h, i) => {
    const c = cols[i];
    const tw = fontBold.widthOfTextAtSize(h, 8);
    const tx =
      c.align === "right" ? hx + c.w - 5 - tw : c.align === "center" ? hx + (c.w - tw) / 2 : hx + 4;
    drawSafe(page, fontBold, h, tx, y - 14, 8, WHITE);
    hx += c.w;
  });
  y -= 22;

  items.forEach((item, idx) => {
    const nameLines = wrapLines(item.name, font, 8, cols[2].w - 8);
    const rowH = Math.max(36, 12 + nameLines.length * 11);
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
    const firstLineY = y - 14;
    cells.forEach((val, i) => {
      const c = cols[i];
      if (i === 2) {
        nameLines.forEach((line, li) => {
          drawSafe(page, font, line, cx + 4, firstLineY - li * 11, 8);
        });
        cx += c.w;
        return;
      }
      const f = i >= 5 ? fontBold : font;
      const safe = sanitizeTextForStandardPdfFont(val);
      const tw = f.widthOfTextAtSize(safe, 8);
      const tx =
        c.align === "right" ? cx + c.w - 5 - tw : c.align === "center" ? cx + (c.w - tw) / 2 : cx + 4;
      drawSafe(page, f, val, tx, firstLineY, 8);
      cx += c.w;
    });
    y -= rowH;
  });

  const sumW = 220;
  const sumX = margin + tableW - sumW;
  y -= 12;
  page.drawLine({
    start: { x: sumX, y },
    end: { x: margin + tableW, y },
    thickness: 1.4,
    color: TEAL,
  });
  if (customerVat) {
    y -= 18;
    drawSafe(page, font, "Netto", sumX + 8, y, 9, MUTED);
    drawRight(page, font, formatEur(customerVat.netCents), margin + tableW - 4, y, 9, TEXT);
    y -= 16;
    drawSafe(page, font, "zzgl. 19 % MwSt.", sumX + 8, y, 9, MUTED);
    drawRight(page, font, formatEur(customerVat.vatCents), margin + tableW - 4, y, 9, TEXT);
    y -= 18;
    drawSafe(page, fontBold, "Gesamtbetrag", sumX + 8, y, 10, TEAL);
    drawRight(page, fontBold, formatEur(customerVat.grossCents), margin + tableW - 4, y, 10, TEAL);
    page.drawLine({
      start: { x: sumX, y: y - 8 },
      end: { x: margin + tableW, y: y - 8 },
      thickness: 1.4,
      color: TEAL,
    });
    y -= 28;
  } else {
    y -= 22;
    drawSafe(page, fontBold, "Gesamtsumme", sumX + 8, y, 10, TEAL);
    drawRight(page, fontBold, formatEur(totalCents), margin + tableW - 4, y, 10, TEAL);
    page.drawLine({
      start: { x: sumX, y: y - 8 },
      end: { x: margin + tableW, y: y - 8 },
      thickness: 1.4,
      color: TEAL,
    });
    y -= 36;
    page.drawRectangle({
      x: margin,
      y: y - 28,
      width: contentW,
      height: 28,
      color: GREEN_BG,
    });
    drawSafe(
      page,
      font,
      "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.",
      margin + 10,
      y - 17,
      9,
      TEAL_DARK
    );
    y -= 48;
  }

  tealBar(page, margin, y, contentW, 20, "ZAHLUNGSBEDINGUNGEN", fontBold);
  y -= 38;
  const payLines = wrapLines(
    "Bitte überweisen Sie den Gesamtbetrag innerhalb von 7 Tagen nach Rechnungserhalt auf das unten angegebene Konto.",
    font,
    9,
    contentW
  );
  for (const ln of payLines) {
    drawSafe(page, font, ln, margin, y, 9);
    y -= LINE_GAP;
  }
  y -= 22;

  tealBar(page, leftX, y, colW, 20, "BANKVERBINDUNG", fontBold);
  tealBar(page, rightX, y, colW, 20, "KONTAKT", fontBold);
  y -= 34;
  const bankRows: [string, string][] = [
    ["Kontoinhaber:", PDF_COMPANY.legalOwner],
    ["Bank:", PDF_COMPANY.bankName],
    ["IBAN:", PDF_COMPANY.iban],
    ["BIC:", PDF_COMPANY.bic],
  ];
  const contactRows: [string, string][] = [
    ["E-Mail:", PDF_COMPANY.email],
    ["Telefon:", PDF_COMPANY.invoicePhone],
    ["Webseite:", PDF_COMPANY.websiteUrl],
  ];
  const pairN = Math.max(bankRows.length, contactRows.length);
  let blockY = y;
  for (let i = 0; i < pairN; i++) {
    if (bankRows[i]) {
      drawLabelValue(page, font, fontBold, leftX, blockY, bankRows[i][0], bankRows[i][1], 88, colW - 96);
    }
    if (contactRows[i]) {
      drawLabelValue(page, font, fontBold, rightX, blockY, contactRows[i][0], contactRows[i][1], 58, colW - 66);
    }
    blockY -= LINE_GAP + 4;
  }
  y = blockY - 16;

  return doc.save();
}

export type ManualCustomerInvoiceInput = {
  customerName: string;
  customerEmail: string;
  phone: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  orderNumber: number;
  printedAuftragNumber: string;
  amountCents: number;
  serviceDateIso: string | null;
  printedInvoiceDate: string;
  pickupAtIso: string | null;
  deliveryAtIso: string | null;
  deliveryStreet: string;
  deliveryHouseNumber: string;
  deliveryPostalCode: string;
  deliveryCity: string;
  deliveryCountry: string;
};

export function buildManualCustomerInvoiceJob(input: ManualCustomerInvoiceInput) {
  const now = new Date().toISOString();
  const pickupStreet = `${input.street} ${input.houseNumber}`.trim();
  const pickupPlzOrt = `${input.postalCode} ${input.city}`.trim();
  const pickupAddr = [pickupStreet, pickupPlzOrt, input.country || "Deutschland"].filter(Boolean).join(", ");
  const hasDelivery = Boolean(
    input.deliveryStreet.trim() || input.deliveryCity.trim() || input.deliveryPostalCode.trim()
  );
  const deliveryStreet = `${input.deliveryStreet} ${input.deliveryHouseNumber}`.trim();
  const deliveryPlzOrt = `${input.deliveryPostalCode} ${input.deliveryCity}`.trim();
  const deliveryCountry = input.deliveryCountry || input.country || "Deutschland";
  const deliveryAddr = hasDelivery
    ? [deliveryStreet, deliveryPlzOrt, deliveryCountry].filter(Boolean).join(", ")
    : pickupAddr;
  const senderAddress = {
    company: input.customerName,
    phone: input.phone,
    street: input.street,
    houseNumber: input.houseNumber,
    postalCode: input.postalCode,
    city: input.city,
    country: input.country || "Deutschland",
    notes: "",
  };
  const recipientAddress = hasDelivery
    ? {
        company: input.customerName,
        phone: input.phone,
        street: input.deliveryStreet,
        houseNumber: input.deliveryHouseNumber,
        postalCode: input.deliveryPostalCode,
        city: input.deliveryCity,
        country: deliveryCountry,
        notes: "",
      }
    : { ...senderAddress };
  return {
    id: "manual-invoice",
    order_number: input.orderNumber,
    company_name: input.customerName,
    pickup_address: pickupAddr,
    pickup_city: input.city || null,
    delivery_address: deliveryAddr,
    delivery_city: (hasDelivery ? input.deliveryCity : input.city) || null,
    phone: input.phone,
    customer_email: input.customerEmail || null,
    preferred_pickup_at: input.pickupAtIso || input.serviceDateIso,
    preferred_delivery_at: input.deliveryAtIso,
    cargo_size: "L" as const,
    cargo_details: {
      senderAddress,
      recipientAddress,
      printedAuftragNumber: input.printedAuftragNumber.trim(),
      printedInvoiceDate: ymdFromValue(input.printedInvoiceDate || input.serviceDateIso || input.pickupAtIso),
    },
    service_type: "driver_car" as const,
    distance_km: null,
    duration_minutes: null,
    price_cents: input.amountCents,
    created_at: now,
    updated_at: now,
    customer_id: null,
    payment_status: "pending" as const,
    logistics_status: "confirmed",
    confirmation_token: null,
    stripe_session_id: null,
    stripe_payment_intent_id: null,
    assigned_driver_id: null,
  };
}

/** Same customer Rechnung layout; company/bank/terms stay TransPool24. Price is net, 19 % MwSt. added. */
export async function generateManualCustomerInvoicePdf(
  input: ManualCustomerInvoiceInput
): Promise<Uint8Array> {
  return generateInvoicePdf(buildManualCustomerInvoiceJob(input), { type: "customer" });
}
