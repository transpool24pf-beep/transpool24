import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import type { Job } from "@/lib/supabase";
import crypto from "crypto";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com";

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const body = await req.json();
  const { job_id } = body;
  if (!job_id) return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
  const supabase = createServerSupabase();
  let job = (await supabase.from("jobs").select("*").eq("id", job_id).single()).data;
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const email = (job as Job).customer_email ?? null;
  if (!email) {
    return NextResponse.json({ error: "No customer email for this order" }, { status: 400 });
  }
  let rating_token = (job as Job & { rating_token?: string | null }).rating_token;
  if (!rating_token) {
    rating_token = crypto.randomBytes(24).toString("hex");
    await supabase.from("jobs").update({ rating_token }).eq("id", job_id);
    job = { ...job, rating_token };
  }
  const rateDriverUrl = `${SITE}/rate-driver?token=${encodeURIComponent(rating_token)}`;
  try {
    const pdf = await generateInvoicePdf(job as Job);
    const result = await sendOrderConfirmationEmail(email, job as Job & { rating_token?: string | null }, pdf, rateDriverUrl);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Email failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/send-order-email]", e);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
