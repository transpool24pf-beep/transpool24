import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { PDF_COMPANY, getPdfLogoBytes } from "./pdf-company";

/** WinAnsi-safe for Helvetica */
function toWinAnsiSafe(s: string): string {
  if (typeof s !== "string") return "";
  return s.replace(/[^\x20-\x7E]/g, "?").trim() || "-";
}

export type DriverPaymentInvoiceData = {
  driver_name: string;
  driver_number: number | null;
  amount_eur: number;
  tip_eur?: number;
  iban: string;
  account_holder_name: string;
  invoice_number: string;
  date: string;
};

function drawText(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  fontBold: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  text: string,
  opts: { x?: number; y: number; size?: number; bold?: boolean }
): number {
  const { y, size = 10, bold = false, x = 50 } = opts;
  const f = bold ? fontBold : font;
  page.drawText(text, { x: x ?? 50, y, size, font: f, color: rgb(0.1, 0.1, 0.15) });
  return y - size - 4;
}

export async function generateDriverPaymentInvoicePdf(data: DriverPaymentInvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  // Header: Logo top right + company (IONOS style)
  const logoBytes = await getPdfLogoBytes();
  let logoDrawn = false;
  if (logoBytes?.length) {
    try {
      const img = await doc.embedPng(logoBytes);
      const imgW = 100;
      const imgH = Math.min(45, (img.height / img.width) * imgW);
      page.drawImage(img, {
        x: width - margin - imgW,
        y: height - margin - imgH,
        width: imgW,
        height: imgH,
      });
      logoDrawn = true;
    } catch {
      try {
        const img = await doc.embedJpg(logoBytes);
        const imgW = 100;
        const imgH = Math.min(45, (img.height / img.width) * imgW);
        page.drawImage(img, {
          x: width - margin - imgW,
          y: height - margin - imgH,
          width: imgW,
          height: imgH,
        });
        logoDrawn = true;
      } catch {
        // skip
      }
    }
  }

  let contactY = logoDrawn ? height - margin - 55 : height - margin - 10;
  const rightX = width - margin - 180;
  contactY = drawText(page, font, fontBold, PDF_COMPANY.name, { x: rightX, y: contactY, size: 10, bold: true });
  contactY = drawText(page, font, fontBold, `E-Mail: ${PDF_COMPANY.email}`, { x: rightX, y: contactY, size: 9 });
  contactY = drawText(page, font, fontBold, `Tel: ${PDF_COMPANY.phone}`, { x: rightX, y: contactY, size: 9 });
  drawText(page, font, fontBold, PDF_COMPANY.website, { x: rightX, y: contactY, size: 9 });

  // Left: Title + recipient
  y = drawText(page, font, fontBold, "Ihre Rechnung / Zahlungsnachweis", { y, size: 14, bold: true, x: margin });
  y = drawText(page, font, fontBold, "Fahrervergütung", { y, size: 11, x: margin });
  y -= 12;

  // Recipient (driver)
  y = drawText(page, font, fontBold, `Empfänger: ${toWinAnsiSafe(data.account_holder_name)}`, { y, size: 10, x: margin });
  y = drawText(page, font, fontBold, `Fahrer: ${toWinAnsiSafe(data.driver_name)}`, { y, size: 10, x: margin });
  if (data.driver_number != null) {
    const num5 = String(data.driver_number).padStart(5, "0");
    y = drawText(page, font, fontBold, `Fahrernummer: ${num5}`, { y, size: 10, x: margin });
  }
  y -= 16;

  // Right: invoice meta
  const metaX = width - margin - 200;
  let metaY = height - margin - 10;
  metaY = drawText(page, font, fontBold, `Rechnungsnummer: ${toWinAnsiSafe(data.invoice_number)}`, { x: metaX, y: metaY, size: 9 });
  metaY = drawText(page, font, fontBold, `Rechnungsdatum: ${data.date}`, { x: metaX, y: metaY, size: 9 });
  metaY = drawText(page, font, fontBold, `Kundennummer: ${data.driver_number != null ? String(data.driver_number).padStart(5, "0") : "-"}`, { x: metaX, y: metaY, size: 9 });

  // Table header
  y -= 8;
  const col1 = margin;
  const col2 = margin + 220;
  const col3 = width - margin - 80;
  page.drawText("Pos.", { x: col1, y, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.15) });
  page.drawText("Die Leistungen im Überblick", { x: col2, y, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.15) });
  page.drawText("Betrag (EUR)", { x: col3, y, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.15) });
  y -= 14;

  const amountStr = data.amount_eur.toFixed(2);
  const tipVal = data.tip_eur ?? 0;
  const tipStr = tipVal > 0 ? tipVal.toFixed(2) : null;
  const totalEur = data.amount_eur + tipVal;

  page.drawText("1", { x: col1, y, size: 9, font, color: rgb(0.1, 0.1, 0.15) });
  page.drawText("Auftragsvergütung", { x: col2, y, size: 9, font, color: rgb(0.1, 0.1, 0.15) });
  page.drawText(amountStr, { x: col3, y, size: 9, font, color: rgb(0.1, 0.1, 0.15) });
  y -= 12;

  if (tipStr) {
    page.drawText("2", { x: col1, y, size: 9, font, color: rgb(0.1, 0.1, 0.15) });
    page.drawText("Trinkgeld (von TransPool24)", { x: col2, y, size: 9, font, color: rgb(0.1, 0.1, 0.15) });
    page.drawText(tipStr, { x: col3, y, size: 9, font, color: rgb(0.1, 0.1, 0.15) });
    y -= 12;
  }

  y -= 8;
  page.drawText("Zu zahlender Betrag:", { x: col2, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.15) });
  page.drawText(`${totalEur.toFixed(2)} EUR`, { x: col3, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.15) });
  y -= 24;

  // Payment details (for company to transfer)
  y = drawText(page, font, fontBold, "Zahlung an:", { y, size: 10, bold: true, x: margin });
  y = drawText(page, font, fontBold, `IBAN: ${toWinAnsiSafe(data.iban)}`, { y, size: 10, x: margin });
  y = drawText(page, font, fontBold, `Kontoinhaber: ${toWinAnsiSafe(data.account_holder_name)}`, { y, size: 10, x: margin });
  y -= 20;

  drawText(page, font, fontBold, "Mit freundlichen Grüßen,", { y, size: 10, x: margin });
  y = drawText(page, font, fontBold, `Rechnungsservice ${PDF_COMPANY.name}`, { y, size: 9, x: margin });
  y -= 12;
  drawText(page, font, fontBold, `${PDF_COMPANY.website}  |  E-Mail: ${PDF_COMPANY.email}  |  Tel: ${PDF_COMPANY.phone}`, { y, size: 8, x: margin });

  return doc.save();
}
