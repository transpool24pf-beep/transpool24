import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { getBookingsSettings } from "@/lib/bookings-settings";

const BOOKINGS_KEY = "bookings";

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const settings = await getBookingsSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const paused = typeof (body as { paused?: unknown }).paused === "boolean" ? (body as { paused: boolean }).paused : null;
  if (paused === null) {
    return NextResponse.json({ error: "paused (boolean) required" }, { status: 400 });
  }
  const value = { paused };
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("settings")
    .upsert({ key: BOOKINGS_KEY, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) {
    console.error("[admin/bookings PATCH]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(value);
}
