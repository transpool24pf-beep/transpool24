import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase";
import { randomUUID } from "crypto";
import { completeDeliveredJob } from "@/lib/job-status-automation";

const BUCKET = "driver-documents";
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB (client also resizes to JPEG)

const MIME_MAP: Record<string, { store: string; ext: string }> = {
  "image/jpeg": { store: "image/jpeg", ext: "jpg" },
  "image/jpg": { store: "image/jpeg", ext: "jpg" },
  "image/pjpeg": { store: "image/jpeg", ext: "jpg" },
  "image/png": { store: "image/png", ext: "png" },
  "image/webp": { store: "image/webp", ext: "webp" },
  "image/heic": { store: "image/heic", ext: "heic" },
  "image/heif": { store: "image/heif", ext: "heif" },
};

function parseImageDataUrl(raw: string): { mime: string; data: string } | null {
  const s = raw.trim();
  const m = s.match(/^data:([^;,]+)(?:;[^,]*)*;base64,([\s\S]+)$/i);
  if (m) {
    return { mime: m[1].trim().toLowerCase(), data: m[2].replace(/\s/g, "") };
  }
  const compact = s.replace(/\s/g, "");
  if (compact.length > 100 && /^[A-Za-z0-9+/]+=*$/.test(compact.slice(0, 120))) {
    return { mime: "image/jpeg", data: compact };
  }
  return null;
}

/**
 * Driver uploads delivery photo (POD) using job_id + driver_tracking_token.
 * Sets pod_photo_url, pod_completed_at, logistics_status = delivered, optional confirmation code.
 */
export async function POST(req: Request) {
  try {
    const limited = rateLimitResponse(req, "upload");
    if (limited) return limited;
    const body = await req.json();
    const jobId = typeof body.job_id === "string" ? body.job_id : null;
    const token = typeof body.token === "string" ? body.token : null;
    const base64 = typeof body.base64 === "string" ? body.base64 : null;

    if (!jobId || !token || !base64) {
      return NextResponse.json({ error: "job_id, token and base64 required" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: job, error: fetchErr } = await supabase
      .from("jobs")
      .select(
        "id, driver_tracking_token, logistics_status, pod_completed_at, pod_photo_url, last_driver_location_at"
      )
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

    /** Pflicht: mindestens eine Live-Position wurde bereits an den Kunden-Tracker gemeldet */
    if (!job.last_driver_location_at) {
      return NextResponse.json(
        {
          error:
            "Live-Standort ist Pflicht: Bitte zuerst „Standortfreigabe starten“ und warten, bis eine Position übertragen wurde. Erst danach Lieferfoto hochladen.",
          code: "LOCATION_REQUIRED",
        },
        { status: 403 }
      );
    }

    const parsed = parseImageDataUrl(base64);
    if (!parsed) {
      return NextResponse.json({ error: "Ungültiges Bildformat." }, { status: 400 });
    }
    const mapped = MIME_MAP[parsed.mime];
    if (!mapped) {
      return NextResponse.json({ error: "Nur JPEG, PNG, WebP oder HEIC erlaubt." }, { status: 400 });
    }
    const buf = Buffer.from(parsed.data, "base64");
    if (!buf.length) {
      return NextResponse.json({ error: "Ungültiges Bildformat." }, { status: 400 });
    }
    if (buf.length > MAX_SIZE) {
      return NextResponse.json({ error: "Datei zu groß (max. 8 MB)." }, { status: 400 });
    }

    const isJpegMagic = buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const store = isJpegMagic ? { store: "image/jpeg", ext: "jpg" } : mapped;
    const safeJob = jobId.replace(/[^a-zA-Z0-9-]/g, "");
    if (safeJob.length < 8) {
      return NextResponse.json({ error: "Ungültiger Auftrag." }, { status: 400 });
    }
    const path = `pod/${safeJob}/${randomUUID()}.${store.ext}`;

    const { data: up, error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: store.store, upsert: false });

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

    const done = await completeDeliveredJob(supabase, jobId, {
      pod_photo_url: publicUrl,
      pod_completed_at: now,
    });
    if (!done.ok) {
      return NextResponse.json({ error: done.message ?? "Update fehlgeschlagen" }, { status: 500 });
    }

    const { data: updated } = await supabase
      .from("jobs")
      .select("id, pod_photo_url, pod_completed_at, logistics_status")
      .eq("id", jobId)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      pod_photo_url: updated?.pod_photo_url ?? publicUrl,
      pod_completed_at: updated?.pod_completed_at ?? now,
      logistics_status: updated?.logistics_status ?? "delivered",
    });
  } catch (e) {
    console.error("[driver-pod]", e);
    return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 });
  }
}
