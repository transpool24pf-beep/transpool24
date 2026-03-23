import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { sendDeliveryConfirmationEmail } from "@/lib/email";
import type { Job } from "@/lib/supabase";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAdmin();
  if (err) return err;
  const { id: jobId } = await params;
  if (!jobId) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

  const supabase = createServerSupabase();
  const { data: job, error: fetchErr } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (fetchErr || !job) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const row = job as Job & { rating_token?: string | null };
  const email = row.customer_email?.trim();
  if (!email) {
    return NextResponse.json({ error: "No customer email for this order" }, { status: 400 });
  }

  const isDelivered =
    row.logistics_status === "delivered" || (row.pod_completed_at != null && String(row.pod_completed_at).length > 0);
  if (!isDelivered) {
    return NextResponse.json(
      {
        error:
          "Order is not marked as delivered yet. Set status to Zugestellt or complete driver POD upload first.",
      },
      { status: 400 }
    );
  }

  let rating_token = row.rating_token;
  if (!rating_token) {
    rating_token = crypto.randomBytes(24).toString("hex");
    await supabase.from("jobs").update({ rating_token }).eq("id", jobId);
  }

  const token = row.confirmation_token;
  const trackOrderUrl = token
    ? `${SITE}/de/order/track?job_id=${encodeURIComponent(jobId)}&token=${encodeURIComponent(token)}`
    : null;
  const rateDriverUrl = `${SITE}/de/rate-driver?token=${encodeURIComponent(rating_token)}`;

  const podPhotoUrl =
    typeof row.pod_photo_url === "string" && row.pod_photo_url.trim().length > 0 ? row.pod_photo_url.trim() : null;

  const result = await sendDeliveryConfirmationEmail(email, row as Job, {
    trackOrderUrl,
    rateDriverUrl,
    podPhotoUrl,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Email failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, sentTo: email });
}
