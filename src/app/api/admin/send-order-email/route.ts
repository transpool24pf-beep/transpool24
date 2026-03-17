import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import type { Job } from "@/lib/supabase";

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const body = await req.json();
  const { job_id } = body;
  if (!job_id) return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
  const supabase = createServerSupabase();
  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", job_id)
    .single();
  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const email = (job as Job).customer_email ?? null;
  if (!email) {
    return NextResponse.json({ error: "No customer email for this order" }, { status: 400 });
  }
  try {
    const pdf = await generateInvoicePdf(job as Job);
    const result = await sendOrderConfirmationEmail(email, job as Job, pdf);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Email failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/send-order-email]", e);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
