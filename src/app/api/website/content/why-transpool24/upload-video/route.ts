import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireWebsiteAdmin } from "@/lib/website-admin-api";
import { createServerSupabase } from "@/lib/supabase";
import { locales } from "@/i18n/routing";

const BUCKET = "driver-documents";
const MAX_SIZE = 80 * 1024 * 1024;
const ALLOWED_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);

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
    const filename = typeof body.filename === "string" ? body.filename : "why.mp4";
    if (!base64) return NextResponse.json({ error: "base64 required" }, { status: 400 });

    const match = base64.match(/^data:([^;]+);base64,(.+)$/);
    const mime = (match ? match[1] : "video/mp4").toLowerCase();
    const raw = match ? match[2] : base64;

    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json(
        { error: "Only MP4, WebM or QuickTime (.mov) allowed." },
        { status: 400 },
      );
    }

    const buf = Buffer.from(raw, "base64");
    if (buf.length > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 80 MB)." }, { status: 400 });
    }

    const ext = mime.includes("webm") ? "webm" : mime.includes("quicktime") ? "mov" : "mp4";
    const safe = filename.replace(/[^\w.\-]+/g, "_").slice(0, 80);
    const path = `why-page-media/${locale}/${randomUUID()}-${safe}.${ext}`;

    const supabase = createServerSupabase();
    const { data: up, error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: mime, upsert: false });

    if (upErr) {
      console.error("[why-transpool24/upload-video]", upErr);
      return NextResponse.json({ error: upErr.message || "Upload failed." }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(up.path);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e) {
    console.error("[why-transpool24/upload-video]", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
