import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { BOOKKEEPING_BUCKET, monthRangeUtc, type BookkeepingReceipt } from "@/lib/bookkeeping";
import { buildBookkeepingMonthPdf } from "@/lib/bookkeeping-month-pdf";
import { createServerSupabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const url = new URL(req.url);
  const now = new Date();
  const year = Number(url.searchParams.get("year") || now.getFullYear());
  const month = Number(url.searchParams.get("month") || now.getMonth() + 1);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }

  const { from, to } = monthRangeUtc(year, month);
  const supabase = createServerSupabase();
  const selectCols =
    "id, original_filename, storage_path, mime_type, vendor_name, document_date, gross_cents, net_cents, vat_cents, vat_rate, currency, category, invoice_number, notes, ocr_status, created_at, updated_at";
  const dated = await supabase
    .from("bookkeeping_receipts")
    .select(selectCols)
    .gte("document_date", from)
    .lt("document_date", to);
  const undated = await supabase
    .from("bookkeeping_receipts")
    .select(selectCols)
    .is("document_date", null)
    .gte("created_at", `${from}T00:00:00.000Z`)
    .lt("created_at", `${to}T00:00:00.000Z`);
  const error = dated.error || undated.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const receipts = [
    ...((dated.data ?? []) as BookkeepingReceipt[]),
    ...((undated.data ?? []) as BookkeepingReceipt[]),
  ].sort((a, b) => (a.document_date || a.created_at).localeCompare(b.document_date || b.created_at));

  const images: { id: string; bytes: Uint8Array; mime: string }[] = [];
  for (const r of receipts) {
    if (!r.mime_type?.startsWith("image/")) continue;
    const { data: file, error: dlErr } = await supabase.storage.from(BOOKKEEPING_BUCKET).download(r.storage_path);
    if (dlErr || !file) continue;
    const buf = new Uint8Array(await file.arrayBuffer());
    const mime = r.mime_type === "image/png" ? "image/png" : "image/jpeg";
    if (r.mime_type === "image/jpeg" || r.mime_type === "image/png") {
      images.push({ id: r.id, bytes: buf, mime });
    }
  }

  const pdf = await buildBookkeepingMonthPdf({ year, month, receipts, images });
  const name = `Belege-TransPool24-${year}-${String(month).padStart(2, "0")}.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
