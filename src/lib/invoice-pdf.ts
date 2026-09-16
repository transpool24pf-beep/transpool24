import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import type { Job } from "./supabase";
import { getPdfLogoBytes, PDF_COMPANY } from "./pdf-company";
import { formatCargoLoadsPlainDe } from "./cargo";

export type InvoiceType = "customer" | "driver";

const NAVY = rgb(0.051, 0.129, 0.216);
const LINE_GRAY = rgb(0.82, 0.86, 0.9);
const ROW_BG = rgb(0.96, 0.97, 0.98);
const TEXT = rgb(0.1, 0.12, 0.16);
const MUTED = rgb(0.35, 0.4, 0.48);
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
  const words = safe.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
      cur = trial;
    } else {
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
  const margin = 42;
  const contentW = width - margin * 2;
  let y = height - 36;

  const logoBytes = await getPdfLogoBytes();
  if (logoBytes && logoBytes.length > 0) {
    try {
      const img = await doc.embedPng(logoBytes);
      const imgW = 132;
      const imgH = Math.min(48, (img.height / img.width) * imgW);
      page.drawImage(img, { x: width - margin - imgW, y: y - imgH + 8, width: imgW, height: imgH });
    } catch {
      try {
        const img = await doc.embedJpg(logoBytes);
        const imgW = 132;
        const imgH = Math.min(48, (img.height / img.width) * imgW);
        page.drawImage(img, { x: width - margin - imgW, y: y - imgH + 8, width: imgW, height: imgH });
      } catch {
        /* skip */
      }
    }
  }

  const title = type === "driver" ? "GRUPPENRECHNUNG" : "RECHNUNG";
  drawSafe(page, fontBold, title, margin, y, 22, NAVY);
  y -= 16;
  drawSafe(page, font, "Transport & Logistik", margin, y, 10, MUTED);
  y -= 22;

  const invoiceNo = invoiceNumberForJob(job);
  const invoiceDate = formatDeDate(new Date());
  const leistungDate = formatDeDate(
    job.pod_completed_at || job.preferred_pickup_at || job.created_at
  );
  drawSafe(page, font, "Rechnungsnummer:", margin, y, 9, MUTED);
  drawSafe(page, fontBold, invoiceNo, margin + 110, y, 9);
  y -= 13;
  drawSafe(page, font, "Rechnungsdatum:", margin, y, 9, MUTED);
  drawSafe(page, font, invoiceDate, margin + 110, y, 9);
  y -= 13;
  drawSafe(page, font, "Leistungsdatum:", margin, y, 9, MUTED);
  drawSafe(page, font, leistungDate, margin + 110, y, 9);
  y -= 20;

  const colGap = 12;
  const colW = (contentW - colGap) / 2;
  const boxH = 118;
  const leftX = margin;
  const rightX = margin + colW + colGap;

  function partyBox(x: number, heading: string, lines: { label: string; value: string }[]) {
    page.drawRectangle({
      x,
      y: y - boxH,
      width: colW,
      height: boxH,
      borderColor: LINE_GRAY,
      borderWidth: 1,
      color: WHITE,
    });
    page.drawRectangle({ x, y: y - 18, width: colW, height: 18, color: NAVY });
    drawSafe(page, fontBold, heading, x + 8, y - 13, 8, WHITE);
    let ly = y - 34;
    for (const row of lines) {
      drawSafe(page, font, row.label, x + 8, ly, 8, MUTED);
      const valLines = wrapLines(row.value || "—", font, 8, colW - 16);
      for (const vl of valLines.slice(0, 2)) {
        drawSafe(page, font, vl, x + 8, ly - 11, 8, TEXT);
        ly -= 11;
      }
      ly -= 6;
    }
  }

  const addr = parseDeAddress(
    [job.pickup_address, job.pickup_city].filter(Boolean).join(", ")
  );
  partyBox(leftX, "RECHNUNGSEMPFÄNGER", [
    { label: "Kundenname / Firma:", value: job.company_name || "—" },
    { label: "Straße Hausnummer:", value: addr.street || "—" },
    { label: "PLZ Ort:", value: addr.plzOrt || "Deutschland" },
    {
      label: "Kundennummer (optional):",
      value: job.order_number != null ? String(job.order_number) : "—",
    },
  ]);
  partyBox(rightX, "RECHNUNGSAUSSTELLER", [
    { label: PDF_COMPANY.name, value: PDF_COMPANY.street },
    { label: "PLZ Ort:", value: `${PDF_COMPANY.postalCode} ${PDF_COMPANY.city}` },
    { label: "Land:", value: PDF_COMPANY.country },
    { label: "Steuernummer:", value: PDF_COMPANY.taxNumber },
  ]);
  y -= boxH + 16;

  drawSafe(
    page,
    font,
    "Hiermit berechnen wir Ihnen folgende Transportdienstleistung:",
    margin,
    y,
    9
  );
  y -= 14;

  const dist =
    job.distance_km != null ? `${String(job.distance_km).replace(".", ",")} km` : "";
  const loadsPlain = formatCargoLoadsPlainDe(job.cargo_details as Record<string, unknown> | null);
  const routeBit = [job.pickup_city || "", job.delivery_city || ""].filter(Boolean).join(" - ");
  let serviceName =
    type === "driver"
      ? "Fahrerleistung (Gruppenpreis)"
      : "Transportdienstleistung";
  if (routeBit) serviceName += `: ${routeBit}`;
  if (dist) serviceName += dist ? `, ${dist}` : "";

  type LineItem = { pos: number; art: string; name: string; qty: string; unit: string; unitCents: number };
  const items: LineItem[] = [
    {
      pos: 1,
      art: "TP24",
      name: serviceName,
      qty: "1",
      unit: "Stück",
      unitCents: amountCents,
    },
  ];
  if (type === "driver" && hasAssistant) {
    items.push({
      pos: 2,
      art: "TP24-H",
      name: "Helfer (Gruppenpreis)",
      qty: "1",
      unit: "Stück",
      unitCents: assistantCents,
    });
  }

  const cols = [
    { key: "pos", w: 28, align: "center" as const },
    { key: "art", w: 48, align: "left" as const },
    { key: "name", w: 198, align: "left" as const },
    { key: "qty", w: 42, align: "center" as const },
    { key: "unit", w: 48, align: "center" as const },
    { key: "unitPrice", w: 68, align: "right" as const },
    { key: "total", w: 71, align: "right" as const },
  ];
  const tableW = cols.reduce((s, c) => s + c.w, 0);
  const headers = ["Pos.", "Art.-Nr.", "Bezeichnung", "Anzahl", "Einheit", "Einzelpreis", "Gesamtpreis"];

  page.drawRectangle({ x: margin, y: y - 16, width: tableW, height: 16, color: NAVY });
  let hx = margin;
  headers.forEach((h, i) => {
    const c = cols[i];
    const tw = fontBold.widthOfTextAtSize(h, 7);
    const tx = c.align === "right" ? hx + c.w - 4 - tw : c.align === "center" ? hx + (c.w - tw) / 2 : hx + 3;
    drawSafe(page, fontBold, h, tx, y - 11, 7, WHITE);
    hx += c.w;
  });
  y -= 16;

  const drawItemRow = (item: LineItem, striped: boolean) => {
    const nameLines = wrapLines(item.name, font, 7.5, cols[2].w - 8);
    const extra = loadsPlain && item.pos === 1 ? wrapLines(loadsPlain.replace(/\n/g, " | "), font, 7, cols[2].w - 8) : [];
    const allNames = [...nameLines, ...extra].slice(0, 4);
    const rowH = Math.max(22, 10 + allNames.length * 10);
    if (striped) {
      page.drawRectangle({ x: margin, y: y - rowH, width: tableW, height: rowH, color: ROW_BG });
    }
    page.drawRectangle({
      x: margin,
      y: y - rowH,
      width: tableW,
      height: rowH,
      borderColor: LINE_GRAY,
      borderWidth: 0.6,
    });
    const cells = [
      String(item.pos),
      item.art,
      allNames[0] ?? "",
      item.qty,
      item.unit,
      formatEur(item.unitCents),
      formatEur(item.unitCents),
    ];
    let cx = margin;
    const baseY = y - 12;
    cells.forEach((val, i) => {
      const c = cols[i];
      if (i === 2) {
        allNames.forEach((ln, li) => drawSafe(page, font, ln, cx + 3, baseY - li * 10, li === 0 ? 7.5 : 7));
      } else {
        const f = i >= 5 ? fontBold : font;
        const tw = f.widthOfTextAtSize(sanitizeTextForStandardPdfFont(val), 7.5);
        const tx = c.align === "right" ? cx + c.w - 4 - tw : c.align === "center" ? cx + (c.w - tw) / 2 : cx + 3;
        drawSafe(page, f, val, tx, baseY, 7.5);
      }
      cx += c.w;
    });
    y -= rowH;
  };

  items.forEach((it, i) => drawItemRow(it, i % 2 === 1));

  const totalCents = type === "driver" && hasAssistant ? amountCents + assistantCents : amountCents;
  y -= 4;
  page.drawRectangle({ x: margin + tableW - 180, y: y - 18, width: 180, height: 18, color: NAVY });
  drawSafe(page, fontBold, "Gesamtsumme", margin + tableW - 174, y - 13, 8, WHITE);
  const totalStr = formatEur(totalCents);
  const totalW = fontBold.widthOfTextAtSize(totalStr, 8);
  drawSafe(page, fontBold, totalStr, margin + tableW - 6 - totalW, y - 13, 8, WHITE);
  y -= 32;

  drawSafe(
    page,
    font,
    "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.",
    margin,
    y,
    8,
    MUTED
  );
  y -= 8;
  drawSafe(
    page,
    font,
    "(Kleinunternehmerregelung - kein Ausweis von 19 % MwSt.)",
    margin,
    y,
    8,
    MUTED
  );
  y -= 18;

  page.drawRectangle({ x: margin, y: y - 16, width: contentW, height: 16, color: NAVY });
  drawSafe(page, fontBold, "ZAHLUNGSBEDINGUNGEN", margin + 8, y - 11, 8, WHITE);
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
  y -= 8;

  const bankH = 78;
  page.drawRectangle({
    x: leftX,
    y: y - bankH,
    width: colW,
    height: bankH,
    borderColor: LINE_GRAY,
    borderWidth: 1,
  });
  page.drawRectangle({ x: leftX, y: y - 16, width: colW, height: 16, color: NAVY });
  drawSafe(page, fontBold, "BANKVERBINDUNG", leftX + 8, y - 11, 8, WHITE);
  const bankRows = [
    ["Kontoinhaber:", PDF_COMPANY.legalOwner],
    ["Bank:", PDF_COMPANY.bankName],
    ["IBAN:", PDF_COMPANY.iban],
    ["BIC:", PDF_COMPANY.bic],
  ];
  let by = y - 30;
  for (const [k, v] of bankRows) {
    drawSafe(page, font, k, leftX + 8, by, 8, MUTED);
    drawSafe(page, font, v, leftX + 92, by, 8);
    by -= 12;
  }

  page.drawRectangle({
    x: rightX,
    y: y - bankH,
    width: colW,
    height: bankH,
    borderColor: LINE_GRAY,
    borderWidth: 1,
  });
  page.drawRectangle({ x: rightX, y: y - 16, width: colW, height: 16, color: NAVY });
  drawSafe(page, fontBold, "KONTAKT", rightX + 8, y - 11, 8, WHITE);
  const contactRows = [
    ["E-Mail:", PDF_COMPANY.email],
    ["Telefon:", PDF_COMPANY.phone],
    ["Webseite:", PDF_COMPANY.websiteUrl],
  ];
  let cy = y - 30;
  for (const [k, v] of contactRows) {
    drawSafe(page, font, k, rightX + 8, cy, 8, MUTED);
    drawSafe(page, font, v, rightX + 70, cy, 8);
    cy -= 12;
  }
  y -= bankH + 22;

  if (type === "customer") {
    const ps = job.payment_status;
    const payLabel =
      ps === "paid"
        ? "Bezahlt"
        : ps === "pending"
          ? "Ausstehend"
          : ps === "refunded"
            ? "Erstattet"
            : ps === "failed"
              ? "Fehlgeschlagen"
              : String(ps ?? "—");
    drawSafe(page, font, `Zahlungsstatus: ${payLabel}`, margin, y, 8, MUTED);
    y -= 14;
  }

  const thanks = wrapLines(
    "Vielen Dank für Ihr Vertrauen in TransPool24 - Ihr zuverlässiger Partner für Transport und Logistik.",
    font,
    8,
    contentW
  );
  for (const ln of thanks) {
    drawSafe(page, font, ln, margin, y, 8, MUTED);
    y -= 11;
  }
  y -= 6;
  drawSafe(page, fontBold, "TransPool24  |  Transport & Logistik", margin, y, 8, NAVY);

  return doc.save();
}
