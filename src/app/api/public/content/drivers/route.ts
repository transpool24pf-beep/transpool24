import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { mapHomepageDriverRow, type HomepageDriverRow } from "@/lib/homepage-drivers-map";

// Public API for fetching drivers (used by homepage)
export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("homepage_drivers")
      .select("*")
      .order("order", { ascending: true });

    if (error) throw error;

    const drivers = (data || []).map((d) => mapHomepageDriverRow(d as HomepageDriverRow));

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("[public/content/drivers GET]", error);
    return NextResponse.json({ drivers: [] }, { status: 200 });
  }
}
