import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { sendDriverApprovalEmail } from "@/lib/email";
import { generateDriverApprovalPdf } from "@/lib/driver-approval-pdf";

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const body = await req.json();
  const id = body?.driver_application_id ?? body?.id;
  if (!id) {
    return NextResponse.json({ error: "driver_application_id fehlt" }, { status: 400 });
  }
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("driver_applications")
    .select(
      "full_name, email, phone, city, languages_spoken, approved_at, status, driver_number, vehicle_plate, personal_photo_url, created_at, service_policy_accepted, work_policy_accepted"
    )
    .eq("id", id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Bewerbung nicht gefunden" }, { status: 404 });
  }
  if (data.status !== "approved") {
    return NextResponse.json({ error: "E-Mail nur bei genehmigten Bewerbungen" }, { status: 400 });
  }
  const email = data.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "Keine E-Mail-Adresse hinterlegt" }, { status: 400 });
  }
  const approvedAt =
    data.approved_at != null
      ? typeof data.approved_at === "string"
        ? data.approved_at
        : new Date(data.approved_at).toISOString()
      : new Date().toISOString();
  let pdfBuffer: Uint8Array | undefined;
  try {
    pdfBuffer = await generateDriverApprovalPdf({
      full_name: String(data.full_name ?? ""),
      email: String(data.email ?? ""),
      phone: String(data.phone ?? ""),
      city: String(data.city ?? ""),
      vehicle_plate: data.vehicle_plate != null ? String(data.vehicle_plate) : null,
      languages_spoken: data.languages_spoken != null ? String(data.languages_spoken) : null,
      approved_at: approvedAt,
      driver_number: data.driver_number != null ? Number(data.driver_number) : null,
      application_submitted_at:
        data.created_at != null
          ? typeof data.created_at === "string"
            ? data.created_at
            : new Date(data.created_at).toISOString()
          : null,
      service_policy_accepted: Boolean(data.service_policy_accepted),
      work_policy_accepted: Boolean(data.work_policy_accepted),
    });
  } catch (e) {
    console.warn("[send-driver-approval-email] PDF skip", e);
  }
  const whatsAppLink = process.env.TRANSPOOL24_WHATSAPP_GROUP_LINK || "https://chat.whatsapp.com/ESup6od1fkHCixxMrT162q?mode=gi_t";
  const result = await sendDriverApprovalEmail(
    email,
    {
      full_name: String(data.full_name ?? ""),
      email: String(data.email ?? ""),
      driver_number: data.driver_number != null ? Number(data.driver_number) : null,
      approved_at: approvedAt,
      vehicle_plate: data.vehicle_plate ?? null,
      personal_photo_url: data.personal_photo_url ?? null,
    },
    { whatsAppLink, pdfBuffer }
  );
  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Versand fehlgeschlagen" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
