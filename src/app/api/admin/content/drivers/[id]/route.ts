import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { createClient } from "@/lib/supabase";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createClient();

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

    return NextResponse.json({ driver: data });
  } catch (error) {
    console.error("[admin/content/drivers PUT]", error);
    return NextResponse.json({ error: "Failed to update driver" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  try {
    const { id } = await params;
    const supabase = createClient();

    const { error } = await supabase.from("homepage_drivers").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/content/drivers DELETE]", error);
    return NextResponse.json({ error: "Failed to delete driver" }, { status: 500 });
  }
}
