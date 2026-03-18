import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const SITE_DOMAIN = "www.transpool24.com";

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
  let y = height - 50;

  // Logo: only from env (Vercel serverless has no reliable fs access to public/)
  let logoBytes: Uint8Array | null = null;
  try {
    const base64 = process.env.INVOICE_LOGO_BASE64;
    if (base64 && typeof base64 === "string") {
      logoBytes = new Uint8Array(Buffer.from(base64, "base64"));
    }
  } catch {
    // no logo
  }
  if (logoBytes && logoBytes.length > 0) {
    try {
      const img = await doc.embedPng(logoBytes);
      const imgW = 90;
      const imgH = Math.min(40, (img.height / img.width) * imgW);
      page.drawImage(img, {
        x: width - 50 - imgW,
        y: height - 45 - imgH,
        width: imgW,
        height: imgH,
      });
    } catch {
      try {
        const img = await doc.embedJpg(logoBytes);
        const imgW = 90;
        const imgH = Math.min(40, (img.height / img.width) * imgW);
        page.drawImage(img, {
          x: width - 50 - imgW,
          y: height - 45 - imgH,
          width: imgW,
          height: imgH,
        });
      } catch {
        // skip logo
      }
    }
  }

  // Title
  y = drawText(page, font, fontBold, "TransPool24 - Driver Application Approval", {
    y,
    size: 16,
    bold: true,
  });
  y = drawText(page, font, fontBold, "Zulassung / Approval of membership request", {
    y,
    size: 11,
  });
  y -= 16;

  // Company
  y = drawText(page, font, fontBold, "Company / Unternehmen", { y, size: 10, bold: true });
  y = drawText(page, font, fontBold, "TransPool24", { y, size: 10 });
  y = drawText(page, font, fontBold, SITE_DOMAIN, { y, size: 9 });
  y -= 12;

  // Driver info
  y = drawText(page, font, fontBold, "Driver / Fahrer", { y, size: 10, bold: true });
  if (app.driver_number != null) {
    const num5 = String(Math.round(app.driver_number)).padStart(5, "0");
    y = drawText(page, font, fontBold, `Driver number / Nummer: ${num5}`, { y, size: 10 });
  }
  y = drawText(page, font, fontBold, `Name: ${toWinAnsiSafe(app.full_name)}`, { y, size: 10 });
  y = drawText(page, font, fontBold, `Email: ${toWinAnsiSafe(app.email)}`, { y, size: 10 });
  y = drawText(page, font, fontBold, `Phone / WhatsApp: ${toWinAnsiSafe(app.phone)}`, { y, size: 10 });
  y = drawText(page, font, fontBold, `City: ${toWinAnsiSafe(app.city)}`, { y, size: 10 });
  if (app.vehicle_plate) {
    y = drawText(page, font, fontBold, `Vehicle plate: ${toWinAnsiSafe(app.vehicle_plate)}`, { y, size: 10 });
  }
  if (app.languages_spoken) {
    y = drawText(page, font, fontBold, `Languages: ${toWinAnsiSafe(app.languages_spoken)}`, { y, size: 10 });
  }
  const approvedDateStr =
    typeof app.approved_at === "string" && app.approved_at
      ? new Date(app.approved_at).toLocaleDateString("de-DE")
      : new Date().toLocaleDateString("de-DE");
  y = drawText(page, font, fontBold, `Approval date: ${approvedDateStr}`, { y, size: 10 });
  y -= 20;

  // Welcome text
  y = drawText(page, font, fontBold, "Welcome to TransPool24.", { y, size: 11, bold: true });
  y = drawText(
    page,
    font,
    fontBold,
    "You have been accepted. Please join the TransPool24 driver group to receive jobs.",
    { y, size: 10 }
  );
  y = drawText(
    page,
    font,
    fontBold,
    "You are now waiting for your first task to accept. We will contact you via WhatsApp or email.",
    { y, size: 10 }
  );
  y -= 24;

  // Footer
  y = drawText(page, font, fontBold, "Thank you for joining TransPool24.", { y, size: 9 });
  y = drawText(page, font, fontBold, SITE_DOMAIN, { y, size: 8 });

  return doc.save();
}
