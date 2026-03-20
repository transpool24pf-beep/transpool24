import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { createClient } from "@/lib/supabase";

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("homepage_drivers")
      .select("*")
      .order("order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ drivers: data || [] });
  } catch (error) {
    console.error("[admin/content/drivers GET]", error);
    return NextResponse.json({ drivers: [] }, { status: 200 }); // Return empty array on error
  }
}

export async function POST(request: Request) {
  const err = await requireAdmin();
  if (err) return err;

  try {
    const body = await request.json();
    const supabase = createClient();

    // Get max order
    const { data: maxData } = await supabase
      .from("homepage_drivers")
      .select("order")
      .order("order", { ascending: false })
      .limit(1)
      .single();

    const newOrder = (maxData?.order ?? -1) + 1;

    const { data, error } = await supabase
      .from("homepage_drivers")
      .insert({
        name: body.name,
        photo: body.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(body.name)}&background=e85d04&color=fff&size=128`,
        rating: body.rating || 5,
        comment: body.comment,
        customer_name: body.customerName,
        order: body.order ?? newOrder,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ driver: data });
  } catch (error) {
    console.error("[admin/content/drivers POST]", error);
    return NextResponse.json({ error: "Failed to create driver" }, { status: 500 });
  }
}
