import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function GET(req: Request) {
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
  const body = await req.json();
  const token = typeof body?.token === "string" ? body.token.trim() : null;
  const rating = body?.rating != null ? Number(body.rating) : null;
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
  const { error: updateErr } = await supabase
    .from("jobs")
    .update({ customer_driver_rating: Math.round(rating) })
    .eq("id", job.id);
  if (updateErr) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, message: "Thank you for your rating!" });
}
