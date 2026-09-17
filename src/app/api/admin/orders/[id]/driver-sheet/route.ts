import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { generateDriverRunSheetPdf } from "@/lib/driver-run-sheet-pdf";
import { formatAuftragNumber } from "@/lib/order-ref";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await context.params;
  const supabase = createServerSupabase();
  const { data: job, error } = await supabase.from("jobs").select("*").eq("id", id).single();
  if (error || !job) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  try {
    const pdf = await generateDriverRunSheetPdf(job);
    const nr = formatAuftragNumber(job);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="TransPool24-Fahrerblatt-${nr}.pdf"`,
      },
    });
  } catch (e) {
    console.error("[admin/driver-sheet]", e);
    return NextResponse.json({ error: "PDF failed" }, { status: 500 });
  }
}
