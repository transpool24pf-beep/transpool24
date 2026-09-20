import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { requireAdmin } from "@/lib/admin-api";
import {
  generateManualCustomerInvoicePdf,
} from "@/lib/invoice-pdf";
import { formatAuftragNumber } from "@/lib/order-ref";

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function parseNetCents(raw: unknown): number | null {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function isoOrNull(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const d = new Date(raw.trim());
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  try {
    const body = await req.json();
    const customerName = str(body.customerName, 160);
    const netCents = parseNetCents(body.netEur ?? body.netCents);
    if (!customerName) {
      return NextResponse.json({ error: "CUSTOMER_NAME_REQUIRED" }, { status: 400 });
    }
    if (netCents == null || netCents < 100 || netCents > 50_000_000) {
      return NextResponse.json({ error: "INVALID_NET" }, { status: 400 });
    }
    const customerNumber = str(body.customerNumber, 20);
    const orderNumber = /^\d{1,9}$/.test(customerNumber)
      ? Number(customerNumber)
      : randomInt(100000, 1000000);
    const createdAt = new Date().toISOString();
    const pdf = await generateManualCustomerInvoicePdf({
      customerName,
      phone: str(body.phone, 40),
      street: str(body.street, 120),
      houseNumber: str(body.houseNumber, 20),
      postalCode: str(body.postalCode, 10),
      city: str(body.city, 80),
      country: str(body.country, 80) || "Deutschland",
      orderNumber,
      netCents,
      serviceDateIso: isoOrNull(body.serviceDate),
      pickupAtIso: isoOrNull(body.pickupAt),
      deliveryAtIso: isoOrNull(body.deliveryAt),
      deliveryStreet: str(body.deliveryStreet, 120),
      deliveryHouseNumber: str(body.deliveryHouseNumber, 20),
      deliveryPostalCode: str(body.deliveryPostalCode, 10),
      deliveryCity: str(body.deliveryCity, 80),
      deliveryCountry: str(body.deliveryCountry, 80) || "Deutschland",
    });
    const invoiceNo = formatAuftragNumber({
      order_number: orderNumber,
      created_at: createdAt,
    });
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="TransPool24-Rechnung-${invoiceNo}.pdf"`,
      },
    });
  } catch (e) {
    console.error("[admin/manual-invoice]", e);
    return NextResponse.json({ error: "Invoice generation failed" }, { status: 500 });
  }
}
