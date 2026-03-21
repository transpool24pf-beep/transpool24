import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireWebsiteAdmin } from "@/lib/website-admin-api";
import { createServerSupabase } from "@/lib/supabase";
import { locales } from "@/i18n/routing";

const BUCKET = "driver-documents";
const MAX_IMAGE = 15 * 1024 * 1024;
const MAX_VIDEO = 200 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export async function POST(req: Request) {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  try {
    const body = await req.json();
    const locale = typeof body.locale === "string" ? body.locale : "";
    const kind = body.kind === "video" ? "video" : "image";
    const contentType = typeof body.contentType === "string" ? body.contentType.toLowerCase() : "";
    const filename = typeof body.filename === "string" ? body.filename : "upload.bin";
    const fileSize = typeof body.fileSize === "number" ? body.fileSize : 0;

    if (!locales.includes(locale as (typeof locales)[number])) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }

    if (kind === "image") {
      if (!IMAGE_TYPES.has(contentType)) {
        return NextResponse.json({ error: "Only JPEG, PNG or WebP for images." }, { status: 400 });
      }
      if (fileSize > MAX_IMAGE) {
        return NextResponse.json({ error: `Image max ${MAX_IMAGE / (1024 * 1024)} MB.` }, { status: 400 });
      }
    } else {
      if (!VIDEO_TYPES.has(contentType)) {
        return NextResponse.json({ error: "Only MP4, WebM or MOV for video." }, { status: 400 });
      }
      if (fileSize > MAX_VIDEO) {
        return NextResponse.json({ error: `Video max ${MAX_VIDEO / (1024 * 1024)} MB.` }, { status: 400 });
      }
    }

    const ext =
      kind === "image"
        ? contentType.includes("png")
          ? "png"
          : contentType.includes("webp")
            ? "webp"
            : "jpg"
        : contentType.includes("webm")
          ? "webm"
          : contentType.includes("quicktime")
            ? "mov"
            : "mp4";

    const safe = filename.replace(/[^\w.\-]+/g, "_").slice(0, 80);
    const path = `why-page-media/${locale}/${randomUUID()}-${safe}.${ext}`;

    const supabase = createServerSupabase();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path, { upsert: true });

    if (error || !data) {
      console.error("[why presign]", error);
      return NextResponse.json({ error: error?.message || "Presign failed" }, { status: 500 });
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      publicUrl: pub.publicUrl,
    });
  } catch (e) {
    console.error("[why presign]", e);
    return NextResponse.json({ error: "Presign failed" }, { status: 500 });
  }
}
