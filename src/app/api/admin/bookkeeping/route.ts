import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import {
  BOOKKEEPING_BUCKET,
  isBookkeepingCategory,
  monthRangeUtc,
  type BookkeepingReceipt,
} from "@/lib/bookkeeping";
import { extractReceiptWithAi } from "@/lib/bookkeeping-ocr";
import { createServerSupabase } from "@/lib/supabase";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_BYTES = 4.5 * 1024 * 1024;

function extFor(type: string): string {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "application/pdf") return "pdf";
  return "bin";
}

function missingTable(err: { message?: string; code?: string } | null): boolean {
  const msg = (err?.message ?? "").toLowerCase();
  return err?.code === "PGRST205" || msg.includes("bookkeeping_receipts") || msg.includes("schema cache");
}

async function withFileUrl(
  supabase: ReturnType<typeof createServerSupabase>,
  row: BookkeepingReceipt,
): Promise<BookkeepingReceipt> {
  const { data } = await supabase.storage.from(BOOKKEEPING_BUCKET).createSignedUrl(row.storage_path, 60 * 60);
  return { ...row, file_url: data?.signedUrl ?? null };
}

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
  if (error) {
    if (missingTable(error)) {
      return NextResponse.json(
        { error: "SQL fehlt: supabase/bookkeeping_receipts.sql in Supabase ausführen." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const merged = [...((dated.data ?? []) as BookkeepingReceipt[]), ...((undated.data ?? []) as BookkeepingReceipt[])];
  merged.sort((a, b) => (a.document_date || a.created_at).localeCompare(b.document_date || b.created_at));
  const receipts = await Promise.all(merged.map((row) => withFileUrl(supabase, row)));
  const gross = receipts.reduce((s, r) => s + (r.gross_cents ?? 0), 0);
  const vat = receipts.reduce((s, r) => s + (r.vat_cents ?? 0), 0);
  return NextResponse.json({ year, month, receipts, totals: { gross_cents: gross, vat_cents: vat } });
}

export async function POST(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  const type = file.type || "image/jpeg";
  if (!ALLOWED.has(type)) {
    return NextResponse.json({ error: "Nur JPG, PNG, WebP oder PDF" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "Datei zu groß (max. 4,5 MB)" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const path = `${new Date().getFullYear()}/${randomUUID()}.${extFor(type)}`;
  const { error: upErr } = await supabase.storage.from(BOOKKEEPING_BUCKET).upload(path, buf, {
    contentType: type,
    upsert: false,
  });
  if (upErr) {
    return NextResponse.json(
      {
        error:
          upErr.message.includes("Bucket") || upErr.message.includes("not found")
            ? "Storage-Bucket bookkeeping fehlt. SQL supabase/bookkeeping_receipts.sql ausführen."
            : upErr.message,
      },
      { status: 500 },
    );
  }

  const notes = String(form.get("notes") ?? "").trim() || null;
  const { data: inserted, error: insErr } = await supabase
    .from("bookkeeping_receipts")
    .insert({
      original_filename: file.name || null,
      storage_path: path,
      mime_type: type,
      notes,
      ocr_status: "pending",
    })
    .select(
      "id, original_filename, storage_path, mime_type, vendor_name, document_date, gross_cents, net_cents, vat_cents, vat_rate, currency, category, invoice_number, notes, ocr_status, created_at, updated_at",
    )
    .single();
  if (insErr || !inserted) {
    await supabase.storage.from(BOOKKEEPING_BUCKET).remove([path]);
    if (missingTable(insErr)) {
      return NextResponse.json(
        { error: "SQL fehlt: supabase/bookkeeping_receipts.sql in Supabase ausführen." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: insErr?.message ?? "Insert failed" }, { status: 500 });
  }

  const ocr = await extractReceiptWithAi({ mimeType: type, bytes: buf });
  let row = inserted as BookkeepingReceipt;
  if (ocr.extract) {
    const patch = {
      vendor_name: ocr.extract.vendor_name,
      document_date: ocr.extract.document_date,
      invoice_number: ocr.extract.invoice_number,
      gross_cents: ocr.extract.gross_cents,
      net_cents: ocr.extract.net_cents,
      vat_cents: ocr.extract.vat_cents,
      vat_rate: ocr.extract.vat_rate,
      currency: ocr.extract.currency,
      category: isBookkeepingCategory(ocr.extract.category) ? ocr.extract.category : "sonstiges",
      notes: notes || ocr.extract.notes,
      ocr_raw: ocr.extract.raw,
      ocr_status: ocr.status,
      updated_at: new Date().toISOString(),
    };
    const { data: updated } = await supabase
      .from("bookkeeping_receipts")
      .update(patch)
      .eq("id", row.id)
      .select(
        "id, original_filename, storage_path, mime_type, vendor_name, document_date, gross_cents, net_cents, vat_cents, vat_rate, currency, category, invoice_number, notes, ocr_status, created_at, updated_at",
      )
      .single();
    if (updated) row = updated as BookkeepingReceipt;
  } else {
    await supabase
      .from("bookkeeping_receipts")
      .update({ ocr_status: ocr.status, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    row = { ...row, ocr_status: ocr.status };
  }

  return NextResponse.json({
    receipt: await withFileUrl(supabase, row),
    ocr_status: row.ocr_status,
    ocr_error: ocr.error ?? null,
  });
}
