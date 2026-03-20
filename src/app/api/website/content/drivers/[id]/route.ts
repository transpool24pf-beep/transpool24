import { NextResponse } from "next/server";
import { requireWebsiteAdmin } from "@/lib/website-admin-api";
import { createServerSupabase } from "@/lib/supabase";
import { mapHomepageDriverRow, type HomepageDriverRow } from "@/lib/homepage-drivers-map";

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
      .from("homepage_drivers")
      .update({
        name: body.name,
        photo: body.photo,
        rating: body.rating,
        comment: body.comment,
        customer_name: body.customerName,
        order: body.order,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ driver: mapHomepageDriverRow(data as HomepageDriverRow) });
  } catch (error) {
    console.error("[website/content/drivers PUT]", error);
    return NextResponse.json({ error: "Failed to update driver" }, { status: 500 });
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

    const { error } = await supabase.from("homepage_drivers").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[website/content/drivers DELETE]", error);
    return NextResponse.json({ error: "Failed to delete driver" }, { status: 500 });
  }
}
