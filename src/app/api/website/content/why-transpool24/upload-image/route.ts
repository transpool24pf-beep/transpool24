import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireWebsiteAdmin } from "@/lib/website-admin-api";
import { createServerSupabase } from "@/lib/supabase";
import { locales } from "@/i18n/routing";

const BUCKET = "driver-documents";
const MAX_SIZE = 6 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);

export async function POST(req: Request) {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  try {
    const body = await req.json();
    const locale = typeof body.locale === "string" ? body.locale : "";
    if (!locales.includes(locale as (typeof locales)[number])) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }

    const base64 = typeof body.base64 === "string" ? body.base64 : null;
    const filename = typeof body.filename === "string" ? body.filename : "why.jpg";
    if (!base64) return NextResponse.json({ error: "base64 required" }, { status: 400 });

    const match = base64.match(/^data:([^;]+);base64,(.+)$/);
    const mime = (match ? match[1] : "image/jpeg").toLowerCase();
    const data = match ? match[2] : base64;

    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json({ error: "Only JPEG, PNG or WebP allowed." }, { status: 400 });
    }

    const buf = Buffer.from(data, "base64");
    if (buf.length > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 6 MB)." }, { status: 400 });
    }

    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const safe = filename.replace(/[^\w.\-]+/g, "_").slice(0, 80);
    const path = `why-page-media/${locale}/${randomUUID()}-${safe}.${ext}`;

    const supabase = createServerSupabase();
    const { data: up, error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: mime, upsert: false });

    if (upErr) {
      console.error("[why-transpool24/upload-image]", upErr);
      return NextResponse.json({ error: upErr.message || "Upload failed." }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(up.path);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e) {
    console.error("[why-transpool24/upload-image]", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
