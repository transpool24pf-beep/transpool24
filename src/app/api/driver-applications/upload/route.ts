import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase";

const BUCKET = "driver-documents";
const MAX_SIZE = 4 * 1024 * 1024; // 4MB

export async function POST(req: Request) {
  try {
    const limited = rateLimitResponse(req, "upload");
    if (limited) return limited;
    const body = await req.json();
    const { base64, filename } = body as { base64?: string; filename?: string };
    if (!base64 || typeof filename !== "string") {
      return NextResponse.json({ error: "base64 and filename required" }, { status: 400 });
    }
    const match = base64.match(/^data:([^;]+);base64,(.+)$/);
    const mime = match ? match[1] : "image/jpeg";
    const data = match ? match[2] : base64;
    const buf = Buffer.from(data, "base64");
    if (buf.length > MAX_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }
    const ext = mime.includes("pdf") ? "pdf" : mime.includes("png") ? "png" : "jpg";
    const path = `${Date.now()}-${(filename || "file").replace(/\s/g, "-")}.${ext}`;
    const supabase = createServerSupabase();
    const { data: up, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: mime, upsert: false });
    if (error) {
      console.error("[driver-applications/upload]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(up.path);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e) {
    console.error("[driver-applications/upload]", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
