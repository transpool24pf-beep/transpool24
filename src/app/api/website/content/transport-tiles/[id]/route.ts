import { NextResponse } from "next/server";
import { requireWebsiteAdmin } from "@/lib/website-admin-api";
import { createServerSupabase } from "@/lib/supabase";
import {
  mapHomepageTransportTileRow,
  type HomepageTransportTileRow,
} from "@/lib/homepage-transport-tiles-map";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from("homepage_transport_tiles")
      .update({
        title: body.title,
        image_url: body.imageUrl,
        order: body.order,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      tile: mapHomepageTransportTileRow(data as HomepageTransportTileRow),
    });
  } catch (e) {
    console.error("[website/content/transport-tiles PUT]", e);
    return NextResponse.json({ error: "Failed to update tile" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  try {
    const { id } = await params;
    const supabase = createServerSupabase();
    const { error } = await supabase.from("homepage_transport_tiles").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[website/content/transport-tiles DELETE]", e);
    return NextResponse.json({ error: "Failed to delete tile" }, { status: 500 });
  }
}
