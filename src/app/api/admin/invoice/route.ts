import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { generateInvoicePdf, invoiceNumberForJob } from "@/lib/invoice-pdf";
import type { InvoiceType } from "@/lib/invoice-pdf";
import { generateUmzugsvertragPdf, mergeInvoiceAndVertrag } from "@/lib/umzugsvertrag-pdf";

export async function GET(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("job_id");
  const type = (searchParams.get("type") ?? "customer") as InvoiceType;
  if (!jobId || !["customer", "driver"].includes(type)) {
    return NextResponse.json({ error: "Missing job_id or invalid type" }, { status: 400 });
  }
  const supabase = createServerSupabase();
  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (error || !job) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  try {
    const invoicePdf = await generateInvoicePdf(job, { type });
    const invoiceNo = invoiceNumberForJob(job);
    let pdf = invoicePdf;
    let filename = type === "driver"
      ? `TransPool24-Gruppe-${invoiceNo}.pdf`
      : `TransPool24-Rechnung-${invoiceNo}.pdf`;
    if (type === "customer") {
      try {
        const vertrag = await generateUmzugsvertragPdf(job);
        pdf = await mergeInvoiceAndVertrag(invoicePdf, vertrag);
        filename = `TransPool24-Rechnung-Umzugsvertrag-${invoiceNo}.pdf`;
      } catch (ve) {
        console.error("[admin/invoice] Umzugsvertrag failed, sending invoice only:", ve);
      }
    }
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("[admin/invoice] generateInvoicePdf failed:", e);
    return NextResponse.json(
      { error: "Invoice generation failed" },
      { status: 500 }
    );
  }
}
