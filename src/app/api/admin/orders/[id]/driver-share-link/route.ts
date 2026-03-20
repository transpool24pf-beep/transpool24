import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com";

function newDriverToken(): string {
  return randomBytes(24).toString("base64url");
}

/** POST: ensure driver_tracking_token exists, return share URL for WhatsApp / SMS */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id: jobId } = await params;
  if (!jobId) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

  const supabase = createServerSupabase();
  const { data: row, error: fetchErr } = await supabase
    .from("jobs")
    .select("id, driver_tracking_token, order_number")
    .eq("id", jobId)
    .single();
  if (fetchErr || !row) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let token = row.driver_tracking_token as string | null;
  if (!token) {
    token = newDriverToken();
    const { error: upErr } = await supabase
      .from("jobs")
      .update({ driver_tracking_token: token, updated_at: new Date().toISOString() })
      .eq("id", jobId);
    if (upErr) {
      console.error("[driver-share-link]", upErr);
      return NextResponse.json(
        {
          error: upErr.message,
          hint: "Run supabase/add_driver_tracking_token.sql on your database",
        },
        { status: 500 }
      );
    }
  }

  const url = `${SITE}/de/driver/share-location?job_id=${encodeURIComponent(jobId)}&token=${encodeURIComponent(token)}`;
  return NextResponse.json({
    url,
    order_number: row.order_number,
  });
}
