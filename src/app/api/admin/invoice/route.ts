import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import type { InvoiceType } from "@/lib/invoice-pdf";

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
  const pdf = await generateInvoicePdf(job, { type });
  const filename = type === "driver"
    ? `TransPool24-Gruppe-${String(jobId).slice(0, 8)}.pdf`
    : `TransPool24-Rechnung-${String(jobId).slice(0, 8)}.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
