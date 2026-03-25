import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { randomUUID } from "crypto";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extForType(ct: string): string {
  if (ct === "image/jpeg") return "jpg";
  if (ct === "image/png") return "png";
  if (ct === "image/webp") return "webp";
  if (ct === "image/gif") return "gif";
  return "bin";
}

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const type = file.type || "";
  if (!ALLOWED.has(type)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const ext = extForType(type);
  const path = `posts/${randomUUID()}.${ext}`;
  const supabase = createServerSupabase();
  const { error: upErr } = await supabase.storage.from("blog").upload(path, buf, {
    contentType: type,
    upsert: false,
  });
  if (upErr) {
    console.error("[admin/blog/upload]", upErr);
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("blog").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
