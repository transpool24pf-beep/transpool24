import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json();
  const full_name = String(body.fullName || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const city = String(body.city || "").trim();
  const license = String(body.license || "").trim();
  const vehicle_type = String(body.vehicleType || "").trim();
  const availability = String(body.availability || "").trim();
  const experience = String(body.experience || "").trim();
  const note = String(body.note || "").trim();

  if (!full_name || !email || !phone || !city || !license || !vehicle_type || !availability) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("driver_applications")
    .insert({
      full_name,
      email,
      phone,
      city,
      license,
      vehicle_type,
      availability,
      experience: experience || null,
      note: note || null,
      status: "new",
    })
    .select()
    .single();

  if (error) {
    console.error("[driver-applications]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
