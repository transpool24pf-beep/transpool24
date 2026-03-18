import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { generateDriverPaymentInvoicePdf } from "@/lib/driver-payment-invoice-pdf";
import { sendDriverPaymentInvoiceEmail } from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  let body: { amount?: number; tip?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const amount = typeof body?.amount === "number" ? body.amount : parseFloat(String(body?.amount ?? ""));
  const tip = typeof body?.tip === "number" ? body.tip : parseFloat(String(body?.tip ?? "0")) || 0;
  if (Number.isNaN(amount) || amount < 0) {
    return NextResponse.json({ error: "amount (EUR) is required and must be >= 0" }, { status: 400 });
  }
  if (tip < 0) {
    return NextResponse.json({ error: "tip must be >= 0" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("driver_applications")
    .select("full_name, email, driver_number, iban, bank_account_holder_name, status")
    .eq("id", id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (data.status !== "approved") {
    return NextResponse.json({ error: "Only approved drivers" }, { status: 400 });
  }

  const email = (data.email ?? "").trim();
  if (!email) {
    return NextResponse.json({ error: "Driver has no email" }, { status: 400 });
  }

  const iban = (data.iban ?? "").trim() || "—";
  const accountHolder = (data.bank_account_holder_name ?? "").trim() || (data.full_name ?? "—");
  const driverNum = data.driver_number != null ? Number(data.driver_number) : null;
  const invoiceNumber = `TP24-${driverNum != null ? String(driverNum).padStart(5, "0") : "00000"}-${Date.now().toString(36).toUpperCase()}`;
  const contractNumber = `TP24-Vertrag-${driverNum != null ? String(driverNum).padStart(5, "0") : "00000"}-${Date.now().toString(36).toUpperCase()}`;
  const dateStr = new Date().toLocaleDateString("de-DE");
  const totalEur = amount + tip;

  let pdf: Uint8Array;
  try {
    pdf = await generateDriverPaymentInvoicePdf({
      driver_name: String(data.full_name ?? ""),
      driver_number: driverNum,
      amount_eur: amount,
      tip_eur: tip > 0 ? tip : undefined,
      iban,
      account_holder_name: accountHolder,
      invoice_number: invoiceNumber,
      date: dateStr,
      contract_number: contractNumber,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[send-payment-invoice-email] PDF failed", msg, e);
    return NextResponse.json({ error: "PDF generation failed", detail: msg }, { status: 500 });
  }

  const result = await sendDriverPaymentInvoiceEmail(
    email,
    {
      driver_name: String(data.full_name ?? ""),
      invoice_number: invoiceNumber,
      date: dateStr,
      driver_number: driverNum != null ? String(driverNum).padStart(5, "0") : "—",
      contract_number: contractNumber,
      amount_eur: amount.toFixed(2),
      tip_eur: tip.toFixed(2),
      total_eur: totalEur.toFixed(2),
    },
    pdf,
    `TransPool24-Zahlungsnachweis-${driverNum ?? id.slice(0, 8)}.pdf`
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Failed to send email" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
