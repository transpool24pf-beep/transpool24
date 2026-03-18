import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { PDF_COMPANY, getPdfLogoBytes } from "./pdf-company";

/** Helvetica uses WinAnsi; strip non-ASCII to avoid "WinAnsi cannot encode" */
function toWinAnsiSafe(s: string): string {
  if (typeof s !== "string") return "";
  return s.replace(/[^\x20-\x7E]/g, "?").trim() || "-";
}

export type DriverAppForPdf = {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  vehicle_plate: string | null;
  languages_spoken: string | null;
  approved_at: string;
  driver_number?: number | null;
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
  page.drawText(text, {
    x,
    y,
    size,
    font: f,
    color: rgb(0.1, 0.1, 0.15),
  });
  return y - size - 4;
}

export async function generateDriverApprovalPdf(app: DriverAppForPdf): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  // —— Header: IONOS-style ——
  // Left: Title + Subtitle
  y = drawText(page, font, fontBold, "Zulassung zur Fahreranwendung", {
    y,
    size: 16,
    bold: true,
    x: margin,
  });
  y = drawText(page, font, fontBold, "Bestätigung der Mitgliedschaft", {
    y,
    size: 11,
    x: margin,
  });

  // Right: Logo + Company contact block
  const logoBytes = await getPdfLogoBytes();
  let logoDrawn = false;
  if (logoBytes && logoBytes.length > 0) {
    try {
      const img = await doc.embedPng(logoBytes);
      if (!img) throw new Error("no img");
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
        // skip logo
      }
    }
  }

  let contactY = logoDrawn ? height - margin - 55 : height - margin - 10;
  const rightX = width - margin - 180;
  contactY = drawText(page, font, fontBold, PDF_COMPANY.name, {
    x: rightX,
    y: contactY,
    size: 10,
    bold: true,
  });
  contactY = drawText(page, font, fontBold, `E-Mail: ${PDF_COMPANY.email}`, {
    x: rightX,
    y: contactY,
    size: 9,
  });
  contactY = drawText(page, font, fontBold, `Tel: ${PDF_COMPANY.phone}`, {
    x: rightX,
    y: contactY,
    size: 9,
  });
  drawText(page, font, fontBold, PDF_COMPANY.website, {
    x: rightX,
    y: contactY,
    size: 9,
  });

  // Body: start below header
  y -= 28;

  // Fahrer
  y = drawText(page, font, fontBold, "Fahrer", { y, size: 10, bold: true, x: margin });
  if (app.driver_number != null) {
    const num5 = String(Math.round(app.driver_number)).padStart(5, "0");
    y = drawText(page, font, fontBold, `Fahrernummer: ${num5}`, { y, size: 10, x: margin });
  }
  y = drawText(page, font, fontBold, `Name: ${toWinAnsiSafe(app.full_name)}`, { y, size: 10, x: margin });
  y = drawText(page, font, fontBold, `E-Mail: ${toWinAnsiSafe(app.email)}`, { y, size: 10, x: margin });
  y = drawText(page, font, fontBold, `Telefon / WhatsApp: ${toWinAnsiSafe(app.phone)}`, { y, size: 10, x: margin });
  y = drawText(page, font, fontBold, `Stadt: ${toWinAnsiSafe(app.city)}`, { y, size: 10, x: margin });
  if (app.vehicle_plate) {
    y = drawText(page, font, fontBold, `Kennzeichen: ${toWinAnsiSafe(app.vehicle_plate)}`, { y, size: 10, x: margin });
  }
  if (app.languages_spoken) {
    y = drawText(page, font, fontBold, `Sprachen: ${toWinAnsiSafe(app.languages_spoken)}`, { y, size: 10, x: margin });
  }
  const approvedDateStr =
    typeof app.approved_at === "string" && app.approved_at
      ? new Date(app.approved_at).toLocaleDateString("de-DE")
      : new Date().toLocaleDateString("de-DE");
  y = drawText(page, font, fontBold, `Zulassungsdatum: ${approvedDateStr}`, { y, size: 10, x: margin });
  y -= 20;

  // Willkommenstext
  y = drawText(page, font, fontBold, "Willkommen bei TransPool24.", { y, size: 11, bold: true, x: margin });
  y = drawText(
    page,
    font,
    fontBold,
    "Ihre Bewerbung wurde angenommen. Bitte treten Sie der TransPool24-Fahrergruppe bei, um Aufträge zu erhalten.",
    { y, size: 10, x: margin }
  );
  y = drawText(
    page,
    font,
    fontBold,
    "Sie warten nun auf Ihre erste Aufgabe. Wir kontaktieren Sie per WhatsApp oder E-Mail.",
    { y, size: 10, x: margin }
  );
  y -= 24;

  // Footer
  y = drawText(page, font, fontBold, "Vielen Dank für Ihre Teilnahme bei TransPool24.", { y, size: 9, x: margin });
  y = drawText(page, font, fontBold, `${PDF_COMPANY.website}  |  E-Mail: ${PDF_COMPANY.email}  |  Tel: ${PDF_COMPANY.phone}`, { y, size: 8, x: margin });

  return doc.save();
}
