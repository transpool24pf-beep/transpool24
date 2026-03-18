import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const supabase = createServerSupabase();
  const { data: requests, error } = await supabase
    .from("support_requests")
    .select("id, driver_number, name, email, message, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[admin/support-requests]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const list = requests ?? [];
  const driverNumbers = [...new Set(list.map((r) => r.driver_number))];
  let driverMap: Record<number, { full_name: string; phone: string; city: string; id: string }> = {};
  if (driverNumbers.length > 0) {
    const { data: drivers } = await supabase
      .from("driver_applications")
      .select("driver_number, full_name, phone, city, id")
      .in("driver_number", driverNumbers)
      .eq("status", "approved");
    driverMap = (drivers ?? []).reduce(
      (acc, d) => {
        if (d.driver_number != null) acc[d.driver_number] = { full_name: String(d.full_name ?? ""), phone: String(d.phone ?? ""), city: String(d.city ?? ""), id: d.id };
        return acc;
      },
      {} as Record<number, { full_name: string; phone: string; city: string; id: string }>
    );
  }
  const result = list.map((r) => ({
    ...r,
    driver_info: driverMap[r.driver_number] ?? null,
  }));
  return NextResponse.json(result);
}
