import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const limited = rateLimitResponse(req, "publicDriver");
  if (limited) return limited;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("jobs")
    .select("id, order_number, customer_driver_rating")
    .eq("rating_token", token)
    .single();
  if (!data) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    order_number: data.order_number ?? data.id,
    already_rated: data.customer_driver_rating != null,
  });
}

export async function POST(req: Request) {
  const limited = rateLimitResponse(req, "publicDriver");
  if (limited) return limited;
  const body = await req.json();
  const token = typeof body?.token === "string" ? body.token.trim() : null;
  const rating = body?.rating != null ? Number(body.rating) : null;
  const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 500) : null;
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  if (rating == null || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  }
  const supabase = createServerSupabase();
  const { data: job, error: fetchErr } = await supabase
    .from("jobs")
    .select("id")
    .eq("rating_token", token)
    .single();
  if (fetchErr || !job) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }
  const ratedAt = new Date().toISOString();
  const updatePayload: {
    customer_driver_rating: number;
    customer_driver_comment?: string | null;
    customer_driver_rated_at: string;
  } = {
    customer_driver_rating: Math.round(rating),
    customer_driver_rated_at: ratedAt,
  };
  if (comment !== undefined) updatePayload.customer_driver_comment = comment || null;
  const { error: updateErr } = await supabase
    .from("jobs")
    .update(updatePayload)
    .eq("id", job.id);
  if (updateErr) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, message: "Thank you for your rating!" });
}
