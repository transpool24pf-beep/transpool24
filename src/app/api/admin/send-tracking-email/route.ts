import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { sendTrackingUpdateEmail, type OrderEmailDriverInfo } from "@/lib/email";
import type { Job } from "@/lib/supabase";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com";

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const body = await req.json().catch(() => ({}));
  const { job_id } = body as { job_id?: string };
  if (!job_id) return NextResponse.json({ error: "Missing job_id" }, { status: 400 });

  const supabase = createServerSupabase();
  const { data: job, error: jobErr } = await supabase.from("jobs").select("*").eq("id", job_id).single();
  if (jobErr || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const email = job.customer_email ?? null;
  if (!email) {
    return NextResponse.json({ error: "No customer email for this order" }, { status: 400 });
  }

  const token = job.confirmation_token as string | null;
  if (!token) {
    return NextResponse.json({ error: "Missing confirmation_token on job" }, { status: 400 });
  }

  const trackOrderUrl = `${SITE}/de/order/track?job_id=${encodeURIComponent(job_id)}&token=${encodeURIComponent(token)}`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(job.pickup_address ?? "")}/${encodeURIComponent(job.delivery_address ?? "")}`;

  let driverInfo: OrderEmailDriverInfo | null = null;
  const driverAppId = job.assigned_driver_application_id as string | null | undefined;
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

  const result = await sendTrackingUpdateEmail(email, job as Job, {
    trackOrderUrl,
    googleMapsDirectionsUrl,
    driver: driverInfo,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Email failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
