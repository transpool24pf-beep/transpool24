import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

// Public API for fetching drivers (used by homepage)
export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("homepage_drivers")
      .select("*")
      .order("order", { ascending: true });

    if (error) throw error;

    // Transform to match DriversCarousel interface
    const drivers = (data || []).map((d) => ({
      id: d.id,
      name: d.name,
      photo: d.photo,
      rating: d.rating,
      comment: d.comment,
      customerName: d.customer_name,
    }));

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("[public/content/drivers GET]", error);
    return NextResponse.json({ drivers: [] }, { status: 200 });
  }
}
