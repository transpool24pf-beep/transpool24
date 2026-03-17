import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Job } from "./supabase";

export type InvoiceType = "customer" | "driver";

export async function generateInvoicePdf(
  job: Job & { driver_price_cents?: number | null },
  options?: { type?: InvoiceType }
): Promise<Uint8Array> {
  const type = options?.type ?? "customer";
  const useDriverPrice = type === "driver" && job.driver_price_cents != null;
  const amountCents = useDriverPrice ? job.driver_price_cents! : job.price_cents;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  let y = height - 60;

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

  // Header
  page.drawText("TransPool24", {
    x: 50,
    y,
    size: 22,
    font: fontBold,
    color: rgb(0.13, 0.13, 0.22),
  });
  y -= 28;
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

  drawText(`Auftragsnummer / Order ID: ${job.id}`, { size: 9 });
  drawText(
    `Datum / Date: ${new Date(job.created_at).toLocaleDateString("de-DE")}`,
    { size: 9 }
  );
  y -= 12;

  drawText("Rechnungsadresse / Billing", { bold: true });
  drawText(job.company_name);
  if (job.customer_email) drawText(job.customer_email);
  drawText(job.phone);
  y -= 12;

  drawText("Transportdetails / Transport details", { bold: true });
  drawText(`Abholung / Pickup: ${job.pickup_address}${job.pickup_city ? `, ${job.pickup_city}` : ""}`);
  drawText(`Lieferung / Delivery: ${job.delivery_address}${job.delivery_city ? `, ${job.delivery_city}` : ""}`);
  drawText(`Ladung / Cargo: ${job.cargo_size}`);
  drawText(`Distanz / Distance: ${job.distance_km ?? "-"} km`);
  y -= 16;

  const totalEur = (amountCents / 100).toFixed(2);
  drawText(`Gesamtbetrag / Total: € ${totalEur}`, { size: 12, bold: true });
  y -= 24;

  page.drawText("Vielen Dank für Ihren Auftrag. / Thank you for your order.", {
    x: 50,
    y,
    size: 9,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  return doc.save();
}
