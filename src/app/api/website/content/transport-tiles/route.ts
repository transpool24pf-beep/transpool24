import { NextResponse } from "next/server";
import { requireWebsiteAdmin } from "@/lib/website-admin-api";
import { createServerSupabase } from "@/lib/supabase";
import {
  mapHomepageTransportTileRow,
  type HomepageTransportTileRow,
} from "@/lib/homepage-transport-tiles-map";

export async function GET() {
  const err = await requireWebsiteAdmin();
  if (err) return err;

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
    console.error("[website/content/transport-tiles GET]", e);
    return NextResponse.json({ tiles: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  try {
    const body = await request.json();
    const supabase = createServerSupabase();

    const { data: maxData } = await supabase
      .from("homepage_transport_tiles")
      .select("order")
      .order("order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const newOrder = (maxData?.order ?? -1) + 1;

    const { data, error } = await supabase
      .from("homepage_transport_tiles")
      .insert({
        title: body.title,
        image_url: body.imageUrl,
        order: body.order ?? newOrder,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      tile: mapHomepageTransportTileRow(data as HomepageTransportTileRow),
    });
  } catch (e) {
    console.error("[website/content/transport-tiles POST]", e);
    return NextResponse.json({ error: "Failed to create tile" }, { status: 500 });
  }
}
