import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Job } from "./supabase";
import { PDF_COMPANY, getPdfLogoBytes } from "./pdf-company";

export type InvoiceType = "customer" | "driver";

function getOrderDisplayId(job: Job & { order_number?: number | null }): string {
  if (job.order_number != null) return String(job.order_number);
  return job.id;
}

export async function generateInvoicePdf(
  job: Job & { driver_price_cents?: number | null; order_number?: number | null },
  options?: { type?: InvoiceType }
): Promise<Uint8Array> {
  const type = options?.type ?? "customer";
  const defaultDriverCents =
    job.distance_km != null && job.distance_km > 0
      ? Math.round(18 * job.distance_km * 2)
      : 1800;
  const amountCents = type === "driver"
    ? (job.driver_price_cents ?? defaultDriverCents)
    : job.price_cents;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  // Header: Logo oben rechts + Kontaktblock (IONOS-Stil)
  const logoBytes = await getPdfLogoBytes();
  let logoDrawn = false;
  if (logoBytes && logoBytes.length > 0) {
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
        // skip logo
      }
    }
  }

  let contactY = logoDrawn ? height - margin - 55 : height - margin - 10;
  const rightX = width - margin - 180;
  contactY = drawText(page, font, fontBold, PDF_COMPANY.name, { x: rightX, y: contactY, size: 10, bold: true });
  contactY = drawText(page, font, fontBold, `E-Mail: ${PDF_COMPANY.email}`, { x: rightX, y: contactY, size: 9 });
  contactY = drawText(page, font, fontBold, `Tel: ${PDF_COMPANY.phone}`, { x: rightX, y: contactY, size: 9 });
  drawText(page, font, fontBold, PDF_COMPANY.website, { x: rightX, y: contactY, size: 9 });

  function drawText(
    p: ReturnType<PDFDocument["addPage"]>,
    f: Awaited<ReturnType<PDFDocument["embedFont"]>>,
    fB: Awaited<ReturnType<PDFDocument["embedFont"]>>,
    text: string,
    opts: { x: number; y: number; size?: number; bold?: boolean }
  ): number {
    const { x, y, size = 10, bold = false } = opts;
    p.drawText(text, { x, y, size, font: bold ? fB : f, color: rgb(0.1, 0.1, 0.1) });
    return y - size - 4;
  }

  // Links: Titel (Rechnung / Gruppenrechnung)
  const headerTitle = type === "driver" ? "Gruppenrechnung (Fahrerpreis)" : "Rechnung";
  page.drawText(headerTitle, {
    x: margin,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.3),
  });
  y -= 24;

  const draw = (text: string, opts: { size?: number; bold?: boolean } = {}) => {
    const size = opts.size ?? 10;
    const f = opts.bold ? fontBold : font;
    page.drawText(text, { x: margin, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
    y -= size + 4;
  };

  draw(`Auftragsnummer: ${getOrderDisplayId(job)}`, { size: 9 });
  draw(`Datum: ${new Date(job.created_at).toLocaleDateString("de-DE")}`, { size: 9 });
  y -= 12;

  draw("Rechnungsadresse", { bold: true });
  draw(job.company_name);
  if (job.customer_email) draw(job.customer_email);
  draw(job.phone);
  if (job.preferred_pickup_at) {
    draw(`Wunschtermin: ${new Date(job.preferred_pickup_at).toLocaleString("de-DE")}`);
  }
  y -= 16;

  draw("Transportdetails", { bold: true });
  draw(`Abholung: ${job.pickup_address}${job.pickup_city ? `, ${job.pickup_city}` : ""}`);
  draw(`Lieferung: ${job.delivery_address}${job.delivery_city ? `, ${job.delivery_city}` : ""}`);
  draw(`Ladung: ${job.cargo_size}`);
  const cd = job.cargo_details as Record<string, unknown> | null;
  if (cd?.cargoCategory) draw(`Kategorie: ${String(cd.cargoCategory)}`);
  if (cd?.cargoLengthCm != null || cd?.cargoWidthCm != null || cd?.cargoHeightCm != null) {
    const l = cd.cargoLengthCm != null ? `${cd.cargoLengthCm}` : "-";
    const w = cd.cargoWidthCm != null ? `${cd.cargoWidthCm}` : "-";
    const h = cd.cargoHeightCm != null ? `${cd.cargoHeightCm}` : "-";
    draw(`Maße (L×B×H cm): ${l} × ${w} × ${h}`);
  }
  const weightKg = cd?.cargoWeightKg ?? cd?.weightKg;
  if (weightKg != null) draw(`Gewicht: ${weightKg} kg`);
  if (cd?.cargoType) draw(`Typ: ${String(cd.cargoType)}`);
  if (cd?.stackable != null) draw(`Stapelbar: ${cd.stackable ? "Ja" : "Nein"}`);
  const st =
    job.service_type === "driver_only"
      ? "Fahrer nur"
      : job.service_type === "driver_car_assistant"
        ? "Fahrer + Auto + Helfer"
        : "Fahrer + Auto";
  draw(`Service: ${st}`);
  draw(`Distanz: ${job.distance_km ?? "-"} km`);
  y -= 12;

  const assistantCents = 1630;
  const hasAssistant = job.service_type === "driver_car_assistant";
  if (type === "driver") {
    draw(`Fahrerpreis: € ${(amountCents / 100).toFixed(2)}`);
    if (hasAssistant) {
      draw(`Helferpreis: € ${(assistantCents / 100).toFixed(2)}`);
    }
    y -= 8;
  }

  const totalCents = type === "driver" && hasAssistant
    ? amountCents + assistantCents
    : amountCents;
  const totalEur = (totalCents / 100).toFixed(2);
  draw(`Gesamtbetrag: € ${totalEur}`, { size: 12, bold: true });
  y -= 16;

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
    draw(`Zahlungsstatus: ${payLabel}`, { size: 10, bold: true });
    if (job.pod_completed_at) {
      draw(
        `Liefernachweis: Zugestellt am ${new Date(job.pod_completed_at).toLocaleString("de-DE")}`,
        { size: 9 }
      );
    }
    y -= 8;
  }

  y -= 8;

  draw("Vielen Dank für Ihren Auftrag.", { size: 9 });
  y -= 8;
  draw(`${PDF_COMPANY.website}  |  E-Mail: ${PDF_COMPANY.email}  |  Tel: ${PDF_COMPANY.phone}`, { size: 8 });

  return doc.save();
}
