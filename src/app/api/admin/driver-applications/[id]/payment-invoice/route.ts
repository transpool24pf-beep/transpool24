import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { generateDriverPaymentInvoicePdf } from "@/lib/driver-payment-invoice-pdf";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const amountStr = searchParams.get("amount");
  const tipStr = searchParams.get("tip") ?? "0";
  const amount = amountStr != null ? parseFloat(amountStr) : NaN;
  if (amountStr == null || amountStr === "" || Number.isNaN(amount) || amount < 0) {
    return NextResponse.json(
      { error: "Query parameter 'amount' (EUR) is required and must be a non-negative number." },
      { status: 400 }
    );
  }
  const tip = parseFloat(tipStr) || 0;
  if (tip < 0) {
    return NextResponse.json({ error: "tip must be >= 0" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("driver_applications")
    .select("full_name, driver_number, iban, bank_account_holder_name, status")
    .eq("id", id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (data.status !== "approved") {
    return NextResponse.json({ error: "Only approved drivers" }, { status: 400 });
  }

  const iban = (data.iban ?? "").trim() || "—";
  const accountHolder = (data.bank_account_holder_name ?? "").trim() || (data.full_name ?? "—");
  const driverNum = data.driver_number != null ? Number(data.driver_number) : null;
  const invoiceNumber = `TP24-${driverNum != null ? String(driverNum).padStart(5, "0") : "00000"}-${Date.now().toString(36).toUpperCase()}`;
  const contractNumber = `TP24-Vertrag-${driverNum != null ? String(driverNum).padStart(5, "0") : "00000"}-${Date.now().toString(36).toUpperCase()}`;
  const dateStr = new Date().toLocaleDateString("de-DE");

  try {
    const pdf = await generateDriverPaymentInvoicePdf({
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
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="TransPool24-Zahlungsnachweis-${driverNum ?? id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[payment-invoice]", msg, e);
    return NextResponse.json(
      { error: "PDF generation failed", detail: msg },
      { status: 500 }
    );
  }
}
