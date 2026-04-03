import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { rateLimitResponse } from "@/lib/rate-limit";
import { sendThankYouDeliveryEmail } from "@/lib/email";
import { isTrustedPodImageUrl } from "@/lib/trusted-image-url";
import type { Job } from "@/lib/supabase";

const BUCKET = "driver-documents";
const PATH_PREFIX = "admin-thankyou-delivery/";
const MAX_BYTES = 4 * 1024 * 1024;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimitResponse(req, "upload");
  if (limited) return limited;

  const err = await requireAdmin();
  if (err) return err;

  const { id: jobId } = await params;
  if (!jobId) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form with file" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Image file required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 4 MB)" }, { status: 400 });
  }
  const mime = (file.type || "image/jpeg").split(";")[0]?.trim().toLowerCase() || "";
  if (!mime.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files allowed" }, { status: 400 });
  }

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

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : mime.includes("gif") ? "gif" : "jpg";
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
  const photoUrl = urlData.publicUrl;
  if (!photoUrl || !isTrustedPodImageUrl(photoUrl)) {
    return NextResponse.json({ error: "Could not build public URL for upload" }, { status: 500 });
  }

  let rating_token = row.rating_token;
  if (!rating_token) {
    rating_token = crypto.randomBytes(24).toString("hex");
    await supabase.from("jobs").update({ rating_token }).eq("id", jobId);
  }
  const rateDriverUrl = `${SITE}/de/rate-driver?token=${encodeURIComponent(rating_token)}`;

  let photoAttachment: { filename: string; contentBase64: string } | null = null;
  try {
    const orderRef = row.order_number != null ? String(row.order_number) : row.id.slice(0, 8);
    photoAttachment = {
      filename: `TransPool24-Liefernachweis-${orderRef}.${ext}`,
      contentBase64: buf.toString("base64"),
    };
  } catch {
    photoAttachment = null;
  }

  const send = await sendThankYouDeliveryEmail(email, row as Job, {
    deliveryPhotoUrl: photoUrl,
    rateDriverUrl,
    photoAttachment,
  });

  if (!send.success) {
    return NextResponse.json({ error: send.error ?? "Email failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sentTo: email, photoUrl });
}
