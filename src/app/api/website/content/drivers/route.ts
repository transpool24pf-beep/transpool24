import { NextResponse } from "next/server";
import { requireWebsiteAdmin } from "@/lib/website-admin-api";
import { createServerSupabase } from "@/lib/supabase";
import { mapHomepageDriverRow, type HomepageDriverRow } from "@/lib/homepage-drivers-map";

export async function GET() {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("homepage_drivers")
      .select("*")
      .order("order", { ascending: true });

    if (error) throw error;

    const drivers = (data || []).map((row) => mapHomepageDriverRow(row as HomepageDriverRow));
    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("[website/content/drivers GET]", error);
    return NextResponse.json({ drivers: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  try {
    const body = await request.json();
    const supabase = createServerSupabase();

    const { data: maxData } = await supabase
      .from("homepage_drivers")
      .select("order")
      .order("order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const newOrder = (maxData?.order ?? -1) + 1;

    const { data, error } = await supabase
      .from("homepage_drivers")
      .insert({
        name: body.name,
        photo:
          body.photo ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(body.name)}&background=e85d04&color=fff&size=128`,
        rating: body.rating || 5,
        comment: body.comment,
        customer_name: body.customerName,
        order: body.order ?? newOrder,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ driver: mapHomepageDriverRow(data as HomepageDriverRow) });
  } catch (error) {
    console.error("[website/content/drivers POST]", error);
    return NextResponse.json({ error: "Failed to create driver" }, { status: 500 });
  }
}
