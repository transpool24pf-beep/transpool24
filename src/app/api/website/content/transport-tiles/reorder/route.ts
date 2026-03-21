import { NextResponse } from "next/server";
import { requireWebsiteAdmin } from "@/lib/website-admin-api";
import { createServerSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  try {
    const body = await request.json();
    const supabase = createServerSupabase();

    const updates = (body.tiles as { id: number; order: number }[]).map((t) =>
      supabase.from("homepage_transport_tiles").update({ order: t.order }).eq("id", t.id),
    );

    await Promise.all(updates);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[website/content/transport-tiles/reorder]", e);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
