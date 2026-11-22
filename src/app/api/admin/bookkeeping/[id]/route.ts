import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { BOOKKEEPING_BUCKET, eurosToCents } from "@/lib/bookkeeping";
import { createServerSupabase } from "@/lib/supabase";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.gross_eur != null) patch.gross_cents = eurosToCents(body.gross_eur);

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("bookkeeping_receipts")
    .update(patch)
    .eq("id", id)
    .select(
      "id, original_filename, storage_path, mime_type, vendor_name, document_date, gross_cents, net_cents, vat_cents, vat_rate, currency, category, invoice_number, notes, ocr_status, created_at, updated_at",
    )
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ receipt: data });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("bookkeeping_receipts")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data?.storage_path) {
    await supabase.storage.from(BOOKKEEPING_BUCKET).remove([data.storage_path]);
  }
  const { error: delErr } = await supabase.from("bookkeeping_receipts").delete().eq("id", id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
