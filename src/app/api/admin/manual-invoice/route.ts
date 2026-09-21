import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { requireAdmin } from "@/lib/admin-api";
import {
  buildManualCustomerInvoiceJob,
  generateInvoicePdf,
} from "@/lib/invoice-pdf";
import { generateUmzugsvertragPdf } from "@/lib/umzugsvertrag-pdf";
import { formatAuftragNumber } from "@/lib/order-ref";
import { addGermanVat19 } from "@/lib/pricing";
import type { Job } from "@/lib/supabase";

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function parseNetCents(raw: unknown): number | null {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function ymdFrom(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

function isoOrNull(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const ymd = ymdFrom(raw);
  const time = raw.trim().match(/T(\d{2}):(\d{2})/);
  if (ymd && time) {
    const local = new Date(`${ymd}T${time[1]}:${time[2]}:00`);
    if (!Number.isNaN(local.getTime())) return local.toISOString();
  }
  if (ymd) return `${ymd}T12:00:00.000Z`;
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
    const customerNumber = str(body.customerNumber, 40);
    const orderNumber = /^\d{1,9}$/.test(customerNumber)
      ? Number(customerNumber)
      : randomInt(100000, 1000000);
    const input = {
      customerName,
              customerEmail: str(body.customerEmail, 160).replace(/\s/g, ""),
      phone: str(body.phone, 40),
      street: str(body.street, 120),
      houseNumber: str(body.houseNumber, 20),
      postalCode: str(body.postalCode, 10),
      city: str(body.city, 80),
      country: str(body.country, 80) || "Deutschland",
      orderNumber,
      printedAuftragNumber: customerNumber,
      amountCents: addGermanVat19(netCents).grossCents,
      serviceDateIso: isoOrNull(body.serviceDate),
      printedInvoiceDate: ymdFrom(body.serviceDate) || ymdFrom(body.pickupAt),
      paymentDueDays: Number(String(body.paymentDays ?? body.paymentDueDays ?? "7").replace(",", ".")),
      pickupAtIso: isoOrNull(body.pickupAt),
      deliveryAtIso: isoOrNull(body.deliveryAt),
      deliveryStreet: str(body.deliveryStreet, 120),
      deliveryHouseNumber: str(body.deliveryHouseNumber, 20),
      deliveryPostalCode: str(body.deliveryPostalCode, 10),
      deliveryCity: str(body.deliveryCity, 80),
      deliveryCountry: str(body.deliveryCountry, 80) || "Deutschland",
    };
    const job = buildManualCustomerInvoiceJob(input) as Job;
    const invoicePdf = await generateInvoicePdf(job, { type: "customer" });
    const vertragPdf = await generateUmzugsvertragPdf(job);
    const invoiceNo = formatAuftragNumber(job);
    const safeFile = invoiceNo.replace(/[^\w.-]+/g, "_");
    return NextResponse.json({
      invoiceNo,
      rechnungFilename: `TransPool24-Rechnung-${safeFile}.pdf`,
      auftragFilename: `TransPool24-Auftragsbestaetigung-${safeFile}.pdf`,
      rechnung: Buffer.from(invoicePdf).toString("base64"),
      auftrag: Buffer.from(vertragPdf).toString("base64"),
    });
  } catch (e) {
    console.error("[admin/manual-invoice]", e);
    return NextResponse.json({ error: "Invoice generation failed" }, { status: 500 });
  }
}
