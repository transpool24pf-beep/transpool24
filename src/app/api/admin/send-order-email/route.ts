import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { sendOrderConfirmationEmail, type OrderEmailDriverInfo } from "@/lib/email";
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
  let job = (await supabase.from("jobs").select("*").eq("id", job_id).single()).data as (Job & { rating_token?: string | null; assigned_driver_application_id?: string | null }) | null;
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const email = job.customer_email ?? null;
  if (!email) {
    return NextResponse.json({ error: "No customer email for this order" }, { status: 400 });
  }
  let rating_token = job.rating_token;
  if (!rating_token) {
    rating_token = crypto.randomBytes(24).toString("hex");
    await supabase.from("jobs").update({ rating_token }).eq("id", job_id);
    job = { ...job, rating_token };
  }
  const rateDriverUrl = `${SITE}/rate-driver?token=${encodeURIComponent(rating_token)}`;

  let driverInfo: OrderEmailDriverInfo | null = null;
  const driverAppId = (job as { assigned_driver_application_id?: string | null }).assigned_driver_application_id;
  if (driverAppId) {
    const { data: driverRow } = await supabase
      .from("driver_applications")
      .select("full_name, phone, vehicle_plate, languages_spoken, personal_photo_url, star_rating")
      .eq("id", driverAppId)
      .single();
    if (driverRow) {
      driverInfo = {
        full_name: driverRow.full_name ?? "",
        phone: driverRow.phone ?? "",
        vehicle_plate: driverRow.vehicle_plate ?? null,
        languages_spoken: driverRow.languages_spoken ?? null,
        personal_photo_url: driverRow.personal_photo_url ?? null,
        star_rating: driverRow.star_rating ?? null,
      };
    }
  }

  const token = job.confirmation_token;
  const confirmPaymentUrl = token
    ? `${SITE}/de/order/confirm?job_id=${encodeURIComponent(job.id)}&token=${encodeURIComponent(token)}`
    : null;

  try {
    const pdf = await generateInvoicePdf(job as Job);
    const result = await sendOrderConfirmationEmail(email, job, pdf, {
      rateDriverUrl,
      confirmPaymentUrl,
      driver: driverInfo,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Email failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/send-order-email]", e);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
