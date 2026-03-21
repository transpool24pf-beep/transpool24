import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import {
  mapHomepageTransportTileRow,
  type HomepageTransportTileRow,
} from "@/lib/homepage-transport-tiles-map";

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("homepage_transport_tiles")
      .select("*")
      .order("order", { ascending: true });

    if (error) throw error;

    const tiles = (data || []).map((row) =>
      mapHomepageTransportTileRow(row as HomepageTransportTileRow),
    );
    return NextResponse.json({ tiles });
  } catch (e) {
    console.error("[public/content/transport-tiles GET]", e);
    return NextResponse.json({ tiles: [] }, { status: 200 });
  }
}
