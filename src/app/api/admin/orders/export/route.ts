import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** CSV export for spreadsheet / backup (admin only). */
export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, order_number, company_name, phone, customer_email, pickup_address, delivery_address, cargo_size, service_type, distance_km, duration_minutes, price_cents, driver_price_cents, assistant_price_cents, payment_status, logistics_status, preferred_pickup_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const headers = [
    "id",
    "order_number",
    "company_name",
    "phone",
    "customer_email",
    "pickup_address",
    "delivery_address",
    "cargo_size",
    "service_type",
    "distance_km",
    "duration_minutes",
    "price_cents",
    "driver_price_cents",
    "assistant_price_cents",
    "payment_status",
    "logistics_status",
    "preferred_pickup_at",
    "created_at",
    "updated_at",
  ];
  const lines = [headers.join(",")];
  for (const row of data ?? []) {
    lines.push(headers.map((h) => csvCell((row as Record<string, unknown>)[h])).join(","));
  }
  const csv = lines.join("\r\n") + "\r\n";
  const filename = `transpool24-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
