import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { rateLimitResponse } from "@/lib/rate-limit";
import { sendThankYouDeliveryEmail } from "@/lib/email";
import { isTrustedPodImageUrl } from "@/lib/trusted-image-url";
import type { Job } from "@/lib/supabase";
import { completeDeliveredJob } from "@/lib/job-status-automation";

const BUCKET = "driver-documents";
const PATH_PREFIX = "admin-thankyou-delivery/";
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_ATTACH_BYTES = 5 * 1024 * 1024;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com";

async function bytesFromTrustedUrl(url: string): Promise<{ buf: Buffer; ext: string } | null> {
  if (!isTrustedPodImageUrl(url)) return null;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
      headers: { Accept: "image/*,*/*" },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = (res.headers.get("content-type") || "").split(";")[0]?.trim().toLowerCase() || "";
    if (buf.length === 0 || buf.length > MAX_ATTACH_BYTES) return null;
    const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : ct.includes("gif") ? "gif" : "jpg";
    return { buf, ext };
  } catch {
    return null;
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimitResponse(req, "upload");
  if (limited) return limited;

  const err = await requireAdmin();
  if (err) return err;

  const { id: jobId } = await params;
  if (!jobId) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

  const supabase = createServerSupabase();
  const { data: job, error: fetchErr } = await supabase.from("jobs").select("*").eq("id", jobId).single();
  if (fetchErr || !job) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const row = job as Job & { rating_token?: string | null };
  const email = row.customer_email?.trim();
  if (!email) {
    return NextResponse.json({ error: "No customer email for this order" }, { status: 400 });
  }

  let photoUrl =
    typeof row.pod_photo_url === "string" && row.pod_photo_url.trim().length > 0 ? row.pod_photo_url.trim() : "";
  let attachBuf: Buffer | null = null;
  let ext = "jpg";

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      formData = new FormData();
    }
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: "Image too large (max 8 MB)" }, { status: 400 });
      }
      const mime = (file.type || "image/jpeg").split(";")[0]?.trim().toLowerCase() || "";
      if (!mime.startsWith("image/")) {
        return NextResponse.json({ error: "Only image files allowed" }, { status: 400 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : mime.includes("gif") ? "gif" : "jpg";
      const path = `${PATH_PREFIX}${jobId}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buf, {
        contentType: mime,
        upsert: false,
      });
      if (upErr) {
        console.error("[send-thankyou-delivery] upload", upErr);
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      photoUrl = urlData.publicUrl;
      if (!photoUrl || !isTrustedPodImageUrl(photoUrl)) {
        return NextResponse.json({ error: "Could not build public URL for upload" }, { status: 500 });
      }
      attachBuf = buf;
      const now = new Date().toISOString();
      if (row.logistics_status === "cancelled") {
        await supabase
          .from("jobs")
          .update({
            pod_photo_url: photoUrl,
            pod_completed_at: row.pod_completed_at ?? now,
            updated_at: now,
          })
          .eq("id", jobId);
      } else {
        await completeDeliveredJob(supabase, jobId, {
          pod_photo_url: photoUrl,
          pod_completed_at: row.pod_completed_at ?? now,
        });
      }
    }
  }

  if (!photoUrl) {
    return NextResponse.json(
      { error: "No delivery photo yet. Wait for the driver upload or choose a file." },
      { status: 400 }
    );
  }

  if (!attachBuf) {
    const loaded = await bytesFromTrustedUrl(photoUrl);
    if (loaded) {
      attachBuf = loaded.buf;
      ext = loaded.ext;
    }
  }

  let rating_token = row.rating_token;
  if (!rating_token) {
    rating_token = crypto.randomBytes(24).toString("hex");
    await supabase.from("jobs").update({ rating_token }).eq("id", jobId);
    row.rating_token = rating_token;
  }
  const rateDriverUrl = `${SITE}/de/rate-driver?token=${encodeURIComponent(rating_token)}`;

  const orderRef = row.order_number != null ? String(row.order_number) : row.id.slice(0, 8);
  const photoAttachment =
    attachBuf && attachBuf.length > 0
      ? {
          filename: `TransPool24-Liefernachweis-${orderRef}.${ext}`,
          contentBase64: attachBuf.toString("base64"),
        }
      : null;

  const send = await sendThankYouDeliveryEmail(email, { ...row, pod_photo_url: photoUrl } as Job, {
    deliveryPhotoUrl: photoUrl,
    rateDriverUrl,
    photoAttachment,
  });

  if (!send.success) {
    return NextResponse.json({ error: send.error ?? "Email failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sentTo: email, photoUrl });
}
