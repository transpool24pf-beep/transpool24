import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

/** Same bucket as driver docs; path prefix separates order cargo photos. */
const BUCKET = "driver-documents";
const PATH_PREFIX = "order-cargo/";
const MAX_SIZE = 4 * 1024 * 1024; // 4MB

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { base64, filename } = body as { base64?: string; filename?: string };
    if (!base64 || typeof filename !== "string") {
      return NextResponse.json({ error: "base64 and filename required" }, { status: 400 });
    }
    const match = base64.match(/^data:([^;]+);base64,(.+)$/);
    const mime = match ? match[1] : "image/jpeg";
    const data = match ? match[2] : base64;
    if (!mime.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads allowed" }, { status: 400 });
    }
    const buf = Buffer.from(data, "base64");
    if (buf.length > MAX_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }
    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const safeName = (filename || "photo").replace(/\s/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
    const path = `${PATH_PREFIX}${Date.now()}-${safeName}.${ext}`;
    const supabase = createServerSupabase();
    const { data: up, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: mime, upsert: false });
    if (error) {
      console.error("[order-cargo-photos/upload]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(up.path);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e) {
    console.error("[order-cargo-photos/upload]", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
