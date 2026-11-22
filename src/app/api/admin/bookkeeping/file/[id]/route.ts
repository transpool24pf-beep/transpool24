import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { BOOKKEEPING_BUCKET } from "@/lib/bookkeeping";
import { createServerSupabase } from "@/lib/supabase";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("bookkeeping_receipts")
    .select("storage_path, mime_type")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.storage_path) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data: file, error: dlErr } = await supabase.storage.from(BOOKKEEPING_BUCKET).download(data.storage_path);
  if (dlErr || !file) return NextResponse.json({ error: "File missing" }, { status: 404 });
  const buf = Buffer.from(await file.arrayBuffer());
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": data.mime_type || "application/octet-stream",
      "Cache-Control": "private, max-age=300",
    },
  });
}
