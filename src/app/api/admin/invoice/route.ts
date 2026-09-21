import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { generateInvoicePdf, invoiceNumberForJob } from "@/lib/invoice-pdf";
import type { InvoiceType } from "@/lib/invoice-pdf";
import { generateUmzugsvertragPdf } from "@/lib/umzugsvertrag-pdf";

export async function GET(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("job_id");
  const type = (searchParams.get("type") ?? "customer") as InvoiceType;
  const doc = (searchParams.get("doc") ?? "rechnung").toLowerCase();
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
    const invoiceNo = invoiceNumberForJob(job);
    if (type === "customer" && doc === "auftrag") {
      const vertrag = await generateUmzugsvertragPdf(job);
      const filename = `TransPool24-Auftragsbestaetigung-${invoiceNo}.pdf`;
      return new NextResponse(Buffer.from(vertrag), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
    const invoicePdf = await generateInvoicePdf(job, { type });
    const filename = type === "driver"
      ? `TransPool24-Gruppe-${invoiceNo}.pdf`
      : `TransPool24-Rechnung-${invoiceNo}.pdf`;
    return new NextResponse(Buffer.from(invoicePdf), {
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
