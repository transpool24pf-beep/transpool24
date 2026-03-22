import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json();
  const full_name = String(body.fullName || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const city = String(body.city || "").trim();
  const service_policy_accepted = Boolean(body.servicePolicyAccepted);
  const id_document_front_url = body.idDocumentFrontUrl
    ? String(body.idDocumentFrontUrl).trim()
    : body.idDocumentUrl
      ? String(body.idDocumentUrl).trim()
      : null;
  const id_document_back_url = body.idDocumentBackUrl ? String(body.idDocumentBackUrl).trim() : null;
  const id_document_url = id_document_front_url || null;
  const license_front_url = body.licenseFrontUrl ? String(body.licenseFrontUrl).trim() : null;
  const license_back_url = body.licenseBackUrl ? String(body.licenseBackUrl).trim() : null;
  const tax_or_commercial_number = body.taxOrCommercialNumber ? String(body.taxOrCommercialNumber).trim() : null;
  const personal_photo_url = body.personalPhotoUrl ? String(body.personalPhotoUrl).trim() : null;
  const languages_spoken = body.languagesSpoken ? String(body.languagesSpoken).trim() : null;
  const vehicle_plate = body.vehiclePlate ? String(body.vehiclePlate).trim() : null;
  const vehicle_documents_url = body.vehicleDocumentsUrl ? String(body.vehicleDocumentsUrl).trim() : null;
  const vehicle_photo_url = body.vehiclePhotoUrl ? String(body.vehiclePhotoUrl).trim() : null;
  const work_policy_accepted = Boolean(body.workPolicyAccepted);
  const license = body.license ? String(body.license).trim() : "";
  const vehicle_type = body.vehicleType ? String(body.vehicleType).trim() : "";
  const availability = body.availability ? String(body.availability).trim() : "";
  const experience = body.experience ? String(body.experience).trim() : null;
  const note = body.note ? String(body.note).trim() : null;

  if (!full_name || !email || !phone || !city) {
    return NextResponse.json({ error: "Missing required fields (name, email, phone, city)" }, { status: 400 });
  }
  if (!service_policy_accepted) {
    return NextResponse.json({ error: "Service policy consent required" }, { status: 400 });
  }
  if (!work_policy_accepted) {
    return NextResponse.json({ error: "Work policy agreement required" }, { status: 400 });
  }
  if (!id_document_front_url || !id_document_back_url) {
    return NextResponse.json(
      { error: "ID or residence permit: both front and back images are required" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("driver_applications")
    .insert({
      full_name,
      email,
      phone,
      city,
      service_policy_accepted,
      id_document_url: id_document_url || null,
      id_document_front_url: id_document_front_url || null,
      id_document_back_url: id_document_back_url || null,
      license_front_url: license_front_url || null,
      license_back_url: license_back_url || null,
      tax_or_commercial_number: tax_or_commercial_number || null,
      personal_photo_url: personal_photo_url || null,
      languages_spoken: languages_spoken || null,
      vehicle_plate: vehicle_plate || null,
      vehicle_documents_url: vehicle_documents_url || null,
      vehicle_photo_url: vehicle_photo_url || null,
      work_policy_accepted,
      license: license || null,
      vehicle_type: vehicle_type || null,
      availability: availability || null,
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
