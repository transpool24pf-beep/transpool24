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
  contract_number: string;
};

const MARGIN = 50;
const LINE = 14;
const SMALL = 10;

function drawText(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  fontBold: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  text: string,
  opts: { x: number; y: number; size?: number; bold?: boolean }
): void {
  const { x, y, size = 10, bold = false } = opts;
  page.drawText(text, { x, y, size, font: bold ? fontBold : font, color: rgb(0.1, 0.1, 0.15) });
}

export async function generateDriverPaymentInvoicePdf(data: DriverPaymentInvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();

  // —— Zone 1: Header (Logo + Company) ——
  let y = height - MARGIN;
  const logoBytes = await getPdfLogoBytes();
  let logoHeight = 0;
  if (logoBytes?.length) {
    try {
      const img = await doc.embedPng(logoBytes);
      const imgW = 220;
      const imgH = Math.min(100, (img.height / img.width) * imgW);
      logoHeight = imgH;
      page.drawImage(img, {
        x: MARGIN,
        y: y - imgH,
        width: imgW,
        height: imgH,
      });
    } catch {
      try {
        const img = await doc.embedJpg(logoBytes);
        const imgW = 220;
        const imgH = Math.min(100, (img.height / img.width) * imgW);
        logoHeight = imgH;
        page.drawImage(img, { x: MARGIN, y: y - imgH, width: imgW, height: imgH });
      } catch {
        // skip
      }
    }
  }
  const rightX = width - MARGIN - 200;
  drawText(page, font, fontBold, PDF_COMPANY.name, { x: rightX, y: y - 0, size: 11, bold: true });
  drawText(page, font, fontBold, PDF_COMPANY.website, { x: rightX, y: y - SMALL - 2, size: 9 });
  drawText(page, font, fontBold, `E-Mail: ${PDF_COMPANY.email}`, { x: rightX, y: y - (SMALL + 2) * 2, size: 9 });
  drawText(page, font, fontBold, `Tel: ${PDF_COMPANY.phone}`, { x: rightX, y: y - (SMALL + 2) * 3, size: 9 });
  y -= Math.max(58, logoHeight + 20);

  // —— Zone 2: Recipient (left) + Invoice meta (right) ——
  const leftX = MARGIN;
  const metaX = width - MARGIN - 200;
  drawText(page, font, fontBold, "Rechnungsempfänger", { x: leftX, y, size: 10, bold: true });
  drawText(page, font, fontBold, toWinAnsiSafe(data.account_holder_name), { x: leftX, y: y - LINE, size: 10 });
  drawText(page, font, fontBold, `Fahrer: ${toWinAnsiSafe(data.driver_name)}`, { x: leftX, y: y - LINE * 2, size: 10 });
  if (data.driver_number != null) {
    drawText(page, font, fontBold, `Fahrernummer: ${String(data.driver_number).padStart(5, "0")}`, { x: leftX, y: y - LINE * 3, size: 10 });
  }

  drawText(page, font, fontBold, `Rechnungsnummer: ${toWinAnsiSafe(data.invoice_number)}`, { x: metaX, y, size: 9 });
  drawText(page, font, fontBold, `Rechnungsdatum: ${data.date}`, { x: metaX, y: y - SMALL - 2, size: 9 });
  drawText(page, font, fontBold, `Fahrernummer: ${data.driver_number != null ? String(data.driver_number).padStart(5, "0") : "-"}`, { x: metaX, y: y - (SMALL + 2) * 2, size: 9 });
  drawText(page, font, fontBold, `Vertragsnummer: ${toWinAnsiSafe(data.contract_number)}`, { x: metaX, y: y - (SMALL + 2) * 3, size: 9 });
  y -= LINE * 4 + 16;

  // —— Zone 3: Title ——
  drawText(page, font, fontBold, "Ihre Rechnung", { x: leftX, y, size: 14, bold: true });
  drawText(page, font, fontBold, "Fahrervergütung", { x: leftX, y: y - LINE, size: 11 });
  y -= LINE * 2 + 12;

  // —— Zone 4: Table ——
  const col1 = leftX;
  const col2 = leftX + 220;
  const col3 = width - MARGIN - 85;
  page.drawText("Pos.", { x: col1, y, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.15) });
  page.drawText("Die Leistungen im Überblick", { x: col2, y, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.15) });
  page.drawText("Betrag (EUR)", { x: col3, y, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.15) });
  y -= 16;

  const amountStr = data.amount_eur.toFixed(2);
  const tipVal = data.tip_eur ?? 0;
  const tipStr = tipVal > 0 ? tipVal.toFixed(2) : null;
  const totalEur = data.amount_eur + tipVal;

  page.drawText("1", { x: col1, y, size: 9, font, color: rgb(0.1, 0.1, 0.15) });
  page.drawText("Auftragsvergütung", { x: col2, y, size: 9, font, color: rgb(0.1, 0.1, 0.15) });
  page.drawText(amountStr, { x: col3, y, size: 9, font, color: rgb(0.1, 0.1, 0.15) });
  y -= 14;

  if (tipStr) {
    page.drawText("2", { x: col1, y, size: 9, font, color: rgb(0.1, 0.1, 0.15) });
    page.drawText("Trinkgeld (von TransPool24)", { x: col2, y, size: 9, font, color: rgb(0.1, 0.1, 0.15) });
    page.drawText(tipStr, { x: col3, y, size: 9, font, color: rgb(0.1, 0.1, 0.15) });
    y -= 14;
  }

  y -= 8;
  page.drawText("Zu zahlender Betrag:", { x: col2, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.15) });
  page.drawText(`${totalEur.toFixed(2)} EUR`, { x: col3, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.15) });
  y -= 28;

  // —— Zone 5: Payment details ——
  drawText(page, font, fontBold, "Zahlung an:", { x: leftX, y, size: 10, bold: true });
  drawText(page, font, fontBold, `IBAN: ${toWinAnsiSafe(data.iban)}`, { x: leftX, y: y - LINE, size: 10 });
  drawText(page, font, fontBold, `Kontoinhaber: ${toWinAnsiSafe(data.account_holder_name)}`, { x: leftX, y: y - LINE * 2, size: 10 });
  y -= LINE * 3 + 20;

  // —— Zone 6: Help block (right sidebar, same height as Zahlung an) ——
  const helpX = width - MARGIN - 200;
  const helpYStart = y + LINE * 3 + 12;
  let helpY = helpYStart;
  drawText(page, font, fontBold, "Brauchen Sie Hilfe?", { x: helpX, y: helpY, size: 9, bold: true });
  helpY -= SMALL + 2;
  drawText(page, font, fontBold, `Mein TransPool24: ${PDF_COMPANY.website}`, { x: helpX, y: helpY, size: 8 });
  helpY -= SMALL + 1;
  drawText(page, font, fontBold, `Kundenservice ${PDF_COMPANY.name}`, { x: helpX, y: helpY, size: 8 });
  helpY -= SMALL + 1;
  drawText(page, font, fontBold, `E-Mail: ${PDF_COMPANY.email}`, { x: helpX, y: helpY, size: 8 });
  helpY -= SMALL + 1;
  drawText(page, font, fontBold, `Telefon: ${PDF_COMPANY.phone}`, { x: helpX, y: helpY, size: 8 });
  helpY -= SMALL + 1;
  drawText(page, font, fontBold, "LinkedIn: linkedin.com/in/trans-pool-1235803b8", { x: helpX, y: helpY, size: 8 });
  helpY -= SMALL + 1;
  drawText(page, font, fontBold, "Servicezeiten: taeglich rund um die Uhr", { x: helpX, y: helpY, size: 8 });

  // —— Zone 7: Footer (below payment and help blocks) ——
  y -= 28;
  drawText(page, font, fontBold, "Mit freundlichen Grüssen,", { x: leftX, y, size: 10 });
  drawText(page, font, fontBold, `Rechnungsservice ${PDF_COMPANY.name}`, { x: leftX, y: y - LINE, size: 10 });
  y -= LINE * 2 + 8;
  drawText(page, font, fontBold, `${PDF_COMPANY.website}  |  E-Mail: ${PDF_COMPANY.email}  |  Tel: ${PDF_COMPANY.phone}`, { x: leftX, y, size: 8 });

  return doc.save();
}
