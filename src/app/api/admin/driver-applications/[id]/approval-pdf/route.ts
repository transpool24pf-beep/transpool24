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
    .select("full_name, email, phone, city, vehicle_plate, languages_spoken, approved_at, status, driver_number")
    .eq("id", id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (data.status !== "approved" || !data.approved_at) {
    return NextResponse.json({ error: "Application not approved" }, { status: 400 });
  }
  try {
    const approvedAt =
      data.approved_at != null
        ? typeof data.approved_at === "string"
          ? data.approved_at
          : new Date(data.approved_at).toISOString()
        : new Date().toISOString();
    const pdf = await generateDriverApprovalPdf({
      full_name: String(data.full_name ?? ""),
      email: String(data.email ?? ""),
      phone: String(data.phone ?? ""),
      city: String(data.city ?? ""),
      vehicle_plate: data.vehicle_plate != null ? String(data.vehicle_plate) : null,
      languages_spoken: data.languages_spoken != null ? String(data.languages_spoken) : null,
      approved_at: approvedAt,
      driver_number: data.driver_number != null ? Number(data.driver_number) : null,
    });
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="TransPool24-approval-${id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[approval-pdf]", msg, e);
    return NextResponse.json(
      { error: "PDF generation failed", detail: msg },
      { status: 500 }
    );
  }
}
