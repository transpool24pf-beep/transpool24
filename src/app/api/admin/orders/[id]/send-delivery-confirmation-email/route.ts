import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { sendDeliveryConfirmationEmail } from "@/lib/email";
import { isTrustedPodImageUrl } from "@/lib/trusted-image-url";
import type { Job } from "@/lib/supabase";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com";
const MAX_ATTACH_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAdmin();
  if (err) return err;
  const { id: jobId } = await params;
  if (!jobId) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const bodyPodUrl =
    typeof (body as { pod_photo_url?: unknown }).pod_photo_url === "string"
      ? (body as { pod_photo_url: string }).pod_photo_url.trim()
      : "";
  const attachPhoto = (body as { attach_photo?: unknown }).attach_photo === true;

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

  const dbPod =
    typeof row.pod_photo_url === "string" && row.pod_photo_url.trim().length > 0 ? row.pod_photo_url.trim() : "";
  const effectivePodUrl = bodyPodUrl || dbPod || null;

  const hasDeliveredState =
    row.logistics_status === "delivered" ||
    (row.pod_completed_at != null && String(row.pod_completed_at).length > 0);
  const hasPodPhoto = Boolean(effectivePodUrl);

  if (!hasDeliveredState && !hasPodPhoto) {
    return NextResponse.json(
      {
        error:
          "Set order to delivered / complete POD, or provide a delivery photo URL (e.g. from driver upload).",
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

  let podPhotoAttachment: { filename: string; contentBase64: string } | null = null;
  if (attachPhoto && effectivePodUrl && isTrustedPodImageUrl(effectivePodUrl)) {
    try {
      const res = await fetch(effectivePodUrl, {
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
        headers: { Accept: "image/*,*/*" },
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const ct = (res.headers.get("content-type") || "").split(";")[0]?.trim().toLowerCase() || "";
        if (buf.length > 0 && buf.length <= MAX_ATTACH_BYTES && ct.startsWith("image/")) {
          const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : ct.includes("gif") ? "gif" : "jpg";
          podPhotoAttachment = {
            filename: `TransPool24-Liefernachweis-${jobId.slice(0, 8)}.${ext}`,
            contentBase64: buf.toString("base64"),
          };
        }
      }
    } catch (e) {
      console.warn("[send-delivery-confirmation-email] POD attach fetch failed", e);
    }
  }

  const result = await sendDeliveryConfirmationEmail(email, row as Job, {
    trackOrderUrl,
    rateDriverUrl,
    podPhotoUrl: effectivePodUrl,
    podPhotoAttachment,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Email failed" }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    sentTo: email,
    photoIncludedInEmail: Boolean(effectivePodUrl),
    photoAttached: Boolean(podPhotoAttachment),
  });
}
