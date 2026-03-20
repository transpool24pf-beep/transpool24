import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { createServerSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const err = await requireAdmin();
  if (err) return err;

  try {
    const body = await request.json();
    const supabase = createServerSupabase();

    // Update all orders in a transaction-like manner
    const updates = body.drivers.map((d: { id: number; order: number }) =>
      supabase
        .from("homepage_drivers")
        .update({ order: d.order })
        .eq("id", d.id)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/content/drivers/reorder POST]", error);
    return NextResponse.json({ error: "Failed to reorder drivers" }, { status: 500 });
  }
}
