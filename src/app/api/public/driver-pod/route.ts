import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { randomUUID } from "crypto";

const BUCKET = "driver-documents";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);

/**
 * Driver uploads delivery photo (POD) using job_id + driver_tracking_token.
 * Sets pod_photo_url, pod_completed_at, logistics_status = delivered, optional confirmation code.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const jobId = typeof body.job_id === "string" ? body.job_id : null;
    const token = typeof body.token === "string" ? body.token : null;
    const base64 = typeof body.base64 === "string" ? body.base64 : null;
    const filename = typeof body.filename === "string" ? body.filename : "delivery.jpg";
    const confirmationCode =
      typeof body.confirmation_code === "string" ? body.confirmation_code.trim().slice(0, 64) : "";

    if (!jobId || !token || !base64) {
      return NextResponse.json({ error: "job_id, token and base64 required" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: job, error: fetchErr } = await supabase
      .from("jobs")
      .select("id, driver_tracking_token, logistics_status, pod_completed_at, pod_photo_url")
      .eq("id", jobId)
      .maybeSingle();

    if (fetchErr || !job) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!job.driver_tracking_token || job.driver_tracking_token !== token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    if (job.logistics_status === "cancelled") {
      return NextResponse.json({ error: "Auftrag storniert – kein Liefernachweis möglich." }, { status: 400 });
    }

    if (job.logistics_status === "delivered" && job.pod_completed_at) {
      return NextResponse.json({
        ok: true,
        already_completed: true,
        pod_photo_url: job.pod_photo_url,
        message: "Zustellung war bereits bestätigt.",
      });
    }

    const blocked = new Set(["draft"]);
    if (blocked.has(job.logistics_status ?? "")) {
      return NextResponse.json(
        { error: "Auftrag noch nicht freigegeben für Zustellnachweis." },
        { status: 400 }
      );
    }

    const match = base64.match(/^data:([^;]+);base64,(.+)$/);
    const mime = match ? match[1].toLowerCase() : "image/jpeg";
    const data = match ? match[2] : base64;
    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json({ error: "Nur JPEG, PNG oder WebP erlaubt." }, { status: 400 });
    }
    const buf = Buffer.from(data, "base64");
    if (buf.length > MAX_SIZE) {
      return NextResponse.json({ error: "Datei zu groß (max. 5 MB)." }, { status: 400 });
    }

    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const safeName = (filename || "delivery").replace(/[^\w.\-]+/g, "_").slice(0, 80);
    const path = `pod/${jobId}/${randomUUID()}-${safeName}.${ext}`;

    const { data: up, error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: mime, upsert: false });

    if (upErr) {
      console.error("[driver-pod]", upErr);
      return NextResponse.json(
        { error: upErr.message || "Upload fehlgeschlagen (Storage-Bucket prüfen)." },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(up.path);
    const publicUrl = urlData.publicUrl;
    const now = new Date().toISOString();

    const updates: Record<string, unknown> = {
      pod_photo_url: publicUrl,
      pod_completed_at: now,
      logistics_status: "delivered",
      updated_at: now,
    };
    if (confirmationCode) {
      updates.pod_confirmation_code = confirmationCode;
    }

    const { data: updated, error: updErr } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", jobId)
      .select("id, pod_photo_url, pod_completed_at, logistics_status, pod_confirmation_code")
      .single();

    if (updErr) {
      console.error("[driver-pod] job update", updErr);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      pod_photo_url: updated.pod_photo_url,
      pod_completed_at: updated.pod_completed_at,
      logistics_status: updated.logistics_status,
    });
  } catch (e) {
    console.error("[driver-pod]", e);
    return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 });
  }
}
