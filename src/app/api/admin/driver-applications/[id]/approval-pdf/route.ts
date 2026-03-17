import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { generateDriverApprovalPdf } from "@/lib/driver-approval-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("driver_applications")
    .select("full_name, email, phone, city, vehicle_plate, languages_spoken, approved_at, status")
    .eq("id", id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (data.status !== "approved" || !data.approved_at) {
    return NextResponse.json({ error: "Application not approved" }, { status: 400 });
  }
  try {
    const pdf = await generateDriverApprovalPdf({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      city: data.city,
      vehicle_plate: data.vehicle_plate,
      languages_spoken: data.languages_spoken,
      approved_at: data.approved_at,
    });
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="TransPool24-approval-${id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (e) {
    console.error("[approval-pdf]", e);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
