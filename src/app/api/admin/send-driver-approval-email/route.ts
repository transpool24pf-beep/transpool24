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
    return NextResponse.json({ error: "driver_application_id مطلوب" }, { status: 400 });
  }
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("driver_applications")
    .select("full_name, email, phone, approved_at, status, driver_number, vehicle_plate")
    .eq("id", id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }
  if (data.status !== "approved") {
    return NextResponse.json({ error: "يُرسل الإيميل فقط للطلبات المعتمدة" }, { status: 400 });
  }
  const email = data.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "لا يوجد بريد إلكتروني لهذا الطلب" }, { status: 400 });
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
      city: "",
      vehicle_plate: data.vehicle_plate != null ? String(data.vehicle_plate) : null,
      languages_spoken: null,
      approved_at: approvedAt,
      driver_number: data.driver_number != null ? Number(data.driver_number) : null,
    });
  } catch (e) {
    console.warn("[send-driver-approval-email] PDF skip", e);
  }
  const whatsAppLink = process.env.TRANSPOOL24_WHATSAPP_GROUP_LINK || null;
  const result = await sendDriverApprovalEmail(
    email,
    {
      full_name: String(data.full_name ?? ""),
      email: String(data.email ?? ""),
      driver_number: data.driver_number != null ? Number(data.driver_number) : null,
      approved_at: approvedAt,
      vehicle_plate: data.vehicle_plate ?? null,
    },
    { whatsAppLink, pdfBuffer }
  );
  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "فشل الإرسال" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
