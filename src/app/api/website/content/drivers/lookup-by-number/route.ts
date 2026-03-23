import { NextResponse } from "next/server";
import { requireWebsiteAdmin } from "@/lib/website-admin-api";
import { createServerSupabase } from "@/lib/supabase";

/**
 * Load personal_photo_url for an approved driver by driver_number (Website CMS only).
 */
export async function POST(req: Request) {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  try {
    const body = await req.json();
    const raw = body.driverNumber ?? body.number;
    const num = typeof raw === "number" ? raw : parseInt(String(raw ?? "").trim(), 10);
    if (!Number.isFinite(num) || num < 1) {
      return NextResponse.json({ error: "Invalid driver number" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("driver_applications")
      .select("full_name, personal_photo_url, driver_number, status")
      .eq("driver_number", num)
      .maybeSingle();

    if (error) {
      console.error("[website/drivers/lookup-by-number]", error);
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "No driver with this number" }, { status: 404 });
    }

    if (data.status !== "approved") {
      return NextResponse.json({ error: "Driver is not approved" }, { status: 404 });
    }

    const photo = (data.personal_photo_url ?? "").trim();
    if (!photo) {
      return NextResponse.json(
        { error: "No personal photo stored for this driver — upload one in driver application first." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      photoUrl: photo,
      fullName: (data.full_name ?? "").trim(),
      driverNumber: data.driver_number,
    });
  } catch (e) {
    console.error("[website/drivers/lookup-by-number]", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
