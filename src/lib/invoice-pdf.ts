import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Job } from "./supabase";
import fs from "fs";
import path from "path";

export type InvoiceType = "customer" | "driver";

const SITE_DOMAIN = "www.transpool24.com";

function getOrderDisplayId(job: Job & { order_number?: number | null }): string {
  if (job.order_number != null) return String(job.order_number);
  return job.id;
}

export async function generateInvoicePdf(
  job: Job & { driver_price_cents?: number | null; order_number?: number | null },
  options?: { type?: InvoiceType }
): Promise<Uint8Array> {
  const type = options?.type ?? "customer";
  /** عند عدم وجود سعر سائق: 18 × مسافة الذهاب والإياب (بالمليم) */
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
  const page = doc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  let y = height - 60;

  // Logo top-right corner (file or INVOICE_LOGO_BASE64 env for Vercel)
  let logoBytes: Uint8Array | null = null;
  try {
    const base64 = process.env.INVOICE_LOGO_BASE64;
    if (base64) {
      logoBytes = new Uint8Array(Buffer.from(base64, "base64"));
    } else {
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      logoBytes = new Uint8Array(fs.readFileSync(logoPath));
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
        y: height - 50 - imgH,
        width: imgW,
        height: imgH,
      });
    } catch {
      // embed failed
    }
  }

  const drawText = (
    text: string,
    opts: { size?: number; bold?: boolean; x?: number } = {}
  ) => {
    const size = opts.size ?? 10;
    const x = opts.x ?? 50;
    const f = opts.bold ? fontBold : font;
    page.drawText(text, { x, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
    y -= size + 4;
  };

  const orderId = getOrderDisplayId(job);
  const headerTitle = type === "driver"
    ? "Gruppenrechnung (Fahrerpreis) / Group invoice (driver price)"
    : "Rechnung / Invoice";
  page.drawText(headerTitle, {
    x: 50,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.3),
  });
  y -= 24;

  drawText(`Auftragsnummer / Order ID: ${orderId}`, { size: 9 });
  drawText(
    `Datum / Date: ${new Date(job.created_at).toLocaleDateString("de-DE")}`,
    { size: 9 }
  );
  y -= 12;

  drawText("Rechnungsadresse / Billing", { bold: true });
  drawText(job.company_name);
  if (job.customer_email) drawText(job.customer_email);
  drawText(job.phone);
  if (job.preferred_pickup_at) {
    drawText(
      `Wunschtermin / Preferred: ${new Date(job.preferred_pickup_at).toLocaleString("de-DE")}`
    );
  }
  y -= 16;

  drawText("Transportdetails / Transport details", { bold: true });
  drawText(`Abholung / Pickup: ${job.pickup_address}${job.pickup_city ? `, ${job.pickup_city}` : ""}`);
  drawText(`Lieferung / Delivery: ${job.delivery_address}${job.delivery_city ? `, ${job.delivery_city}` : ""}`);
  drawText(`Ladung / Cargo: ${job.cargo_size}`);
  const cd = job.cargo_details as Record<string, unknown> | null;
  if (cd?.cargoCategory) drawText(`Kategorie / Category: ${String(cd.cargoCategory)}`);
  if (cd?.cargoLengthCm != null || cd?.cargoWidthCm != null || cd?.cargoHeightCm != null) {
    const l = cd.cargoLengthCm != null ? `${cd.cargoLengthCm}` : "-";
    const w = cd.cargoWidthCm != null ? `${cd.cargoWidthCm}` : "-";
    const h = cd.cargoHeightCm != null ? `${cd.cargoHeightCm}` : "-";
    drawText(`Maße (L×B×H cm): ${l} × ${w} × ${h}`);
  }
  const weightKg = cd?.cargoWeightKg ?? cd?.weightKg;
  if (weightKg != null) drawText(`Gewicht / Weight: ${weightKg} kg`);
  if (cd?.cargoType) drawText(`Typ / Type: ${String(cd.cargoType)}`);
  if (cd?.stackable != null) drawText(`Stapelbar / Stackable: ${cd.stackable ? "Ja" : "Nein"}`);
  const st =
    job.service_type === "driver_only"
      ? "Fahrer nur"
      : job.service_type === "driver_car_assistant"
        ? "Fahrer + Auto + Helfer"
        : "Fahrer + Auto";
  drawText(`Service: ${st}`);
  drawText(`Distanz / Distance: ${job.distance_km ?? "-"} km`);
  y -= 12;

  const assistantCents = 1630; // 16.30 EUR
  const hasAssistant = job.service_type === "driver_car_assistant";
  if (type === "driver") {
    drawText(`Fahrerpreis: € ${(amountCents / 100).toFixed(2)}`);
    if (hasAssistant) {
      drawText(`Helferpreis: € ${(assistantCents / 100).toFixed(2)}`);
    }
    y -= 8;
  }

  const totalCents = type === "driver" && hasAssistant
    ? amountCents + assistantCents
    : amountCents;
  const totalEur = (totalCents / 100).toFixed(2);
  drawText(`Gesamtbetrag / Total: € ${totalEur}`, { size: 12, bold: true });
  y -= 24;

  page.drawText("Vielen Dank für Ihren Auftrag. / Thank you for your order.", {
    x: 50,
    y,
    size: 9,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 20;

  page.drawText(SITE_DOMAIN, {
    x: 50,
    y,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.5),
  });

  return doc.save();
}
