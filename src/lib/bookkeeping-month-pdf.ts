import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { BookkeepingReceipt } from "@/lib/bookkeeping";
import { formatEurFromCents } from "@/lib/bookkeeping";
import { getPdfLogoBytes, PDF_COMPANY } from "@/lib/pdf-company";
import { sanitizeTextForStandardPdfFont } from "@/lib/invoice-pdf";

const NAVY = rgb(13 / 255, 33 / 255, 55 / 255);
const MUTED = rgb(0.32, 0.38, 0.42);
const LINE = rgb(0.82, 0.86, 0.90);

function S(text: string, max = 180): string {
  return sanitizeTextForStandardPdfFont(text, max);
}

function categoryDe(value: string | null): string {
  switch (value) {
    case "kraftstoff":
      return "Kraftstoff";
    case "werkstatt":
      return "Werkstatt / Reparatur";
    case "maut_parken":
      return "Maut / Parken";
    case "versicherung":
      return "Versicherung";
    case "buero":
      return "Buero / Porto";
    case "telekom":
      return "Telekommunikation";
    case "fahrzeug":
      return "Fahrzeug";
    default:
      return "Sonstiges";
  }
}

export async function buildBookkeepingMonthPdf(input: {
  year: number;
  month: number;
  receipts: BookkeepingReceipt[];
  images: { id: string; bytes: Uint8Array; mime: string }[];
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logoBytes = await getPdfLogoBytes();
  let logo = null as Awaited<ReturnType<PDFDocument["embedPng"]>> | null;
  if (logoBytes) {
    try {
      logo = await doc.embedPng(logoBytes);
    } catch {
      try {
        logo = await doc.embedJpg(logoBytes);
      } catch {
        logo = null;
      }
    }
  }

  const page = doc.addPage([595, 842]);
  let y = 800;
  if (logo) {
    const w = 120;
    const h = (logo.height / logo.width) * w;
    page.drawImage(logo, { x: 40, y: y - h + 10, width: w, height: h });
  }
  page.drawText(S("Belegsammlung fuer den Steuerberater"), {
    x: 180,
    y,
    size: 14,
    font: fontBold,
    color: NAVY,
  });
  y -= 22;
  page.drawText(S(`${PDF_COMPANY.name} · ${PDF_COMPANY.legalOwner}`), {
    x: 180,
    y,
    size: 10,
    font,
    color: MUTED,
  });
  y -= 16;
  page.drawText(S(`${PDF_COMPANY.addressLine} · St.Nr. ${PDF_COMPANY.taxNumber}`), {
    x: 180,
    y,
    size: 9,
    font,
    color: MUTED,
  });
  y -= 28;
  const monthLabel = `${String(input.month).padStart(2, "0")}/${input.year}`;
  page.drawText(S(`Monat: ${monthLabel}`), { x: 40, y, size: 12, font: fontBold, color: NAVY });
  y -= 18;
  const gross = input.receipts.reduce((s, r) => s + (r.gross_cents ?? 0), 0);
  const vat = input.receipts.reduce((s, r) => s + (r.vat_cents ?? 0), 0);
  page.drawText(S(`Anzahl Belege: ${input.receipts.length}`), { x: 40, y, size: 10, font, color: NAVY });
  y -= 14;
  page.drawText(S(`Summe brutto: ${formatEurFromCents(gross)}`), { x: 40, y, size: 10, font, color: NAVY });
  y -= 14;
  page.drawText(S(`enthaltene USt: ${formatEurFromCents(vat)}`), { x: 40, y, size: 10, font, color: NAVY });
  y -= 24;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: LINE });
  y -= 20;
  page.drawText(S("Nr.  Datum        Lieferant                     Kategorie              Brutto"), {
    x: 40,
    y,
    size: 9,
    font: fontBold,
    color: NAVY,
  });
  y -= 14;
  input.receipts.forEach((r, i) => {
    if (y < 60) return;
    const line = `${String(i + 1).padStart(2, "0")}  ${(r.document_date ?? "--------").slice(0, 10)}  ${S(
      r.vendor_name || "-",
      28,
    ).padEnd(28)}  ${S(categoryDe(r.category), 20).padEnd(20)}  ${formatEurFromCents(r.gross_cents)}`;
    page.drawText(line, { x: 40, y, size: 8, font, color: NAVY });
    y -= 12;
  });
  page.drawText(S("Jedes Original folgt auf den naechsten Seiten."), {
    x: 40,
    y: 40,
    size: 8,
    font,
    color: MUTED,
  });

  const imagesById = new Map(input.images.map((im) => [im.id, im]));
  for (const [idx, r] of input.receipts.entries()) {
    const p = doc.addPage([595, 842]);
    let py = 800;
    p.drawText(S(`Beleg ${idx + 1} / ${input.receipts.length}`), {
      x: 40,
      y: py,
      size: 12,
      font: fontBold,
      color: NAVY,
    });
    py -= 18;
    const rows = [
      ["Lieferant", r.vendor_name || "-"],
      ["Datum", r.document_date || "-"],
      ["Belegnr.", r.invoice_number || "-"],
      ["Kategorie", categoryDe(r.category)],
      ["Netto", formatEurFromCents(r.net_cents)],
      ["USt", formatEurFromCents(r.vat_cents)],
      ["Brutto", formatEurFromCents(r.gross_cents)],
    ];
    for (const [k, v] of rows) {
      p.drawText(S(`${k}: ${v}`), { x: 40, y: py, size: 10, font, color: NAVY });
      py -= 14;
    }
    const img = imagesById.get(r.id);
    if (img) {
      try {
        const embedded =
          img.mime === "image/png" ? await doc.embedPng(img.bytes) : await doc.embedJpg(img.bytes);
        const maxW = 515;
        const maxH = 560;
        const scale = Math.min(maxW / embedded.width, maxH / embedded.height, 1);
        const w = embedded.width * scale;
        const h = embedded.height * scale;
        p.drawImage(embedded, { x: 40, y: Math.max(40, py - 16 - h), width: w, height: h });
      } catch {
        p.drawText(S("Originalbild konnte nicht eingebettet werden."), {
          x: 40,
          y: py - 20,
          size: 9,
          font,
          color: MUTED,
        });
      }
    }
  }

  return doc.save();
}
