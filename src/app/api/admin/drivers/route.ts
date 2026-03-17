import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const supabase = createServerSupabase();
  const { data: profiles, error: profError } = await supabase
    .from("profiles")
    .select("id, email, full_name, company_name, phone, role, star_rating, avatar_url, created_at")
    .eq("role", "driver")
    .order("created_at", { ascending: false });
  if (profError) {
    console.error("[admin/drivers]", profError);
    return NextResponse.json({ error: profError.message }, { status: 500 });
  }
  const { data: docs } = await supabase
    .from("driver_documents")
    .select("driver_id, document_type, storage_path, file_name, verified");
  const byDriver = (docs ?? []).reduce<Record<string, typeof docs>>((acc, d) => {
    const id = d.driver_id;
    if (!acc[id]) acc[id] = [];
    acc[id].push(d);
    return acc;
  }, {});
  const fromProfiles = (profiles ?? []).map((p) => ({
    ...p,
    documents: byDriver[p.id] ?? [],
    source: "profile" as const,
    driver_number: null as number | null,
  }));

  const { data: approvedApps } = await supabase
    .from("driver_applications")
    .select("id, full_name, email, phone, city, driver_number, personal_photo_url, approved_at, created_at")
    .eq("status", "approved")
    .not("driver_number", "is", null)
    .order("driver_number", { ascending: true });
  const fromApplications = (approvedApps ?? []).map((a) => ({
    id: a.id,
    email: a.email,
    full_name: a.full_name,
    company_name: null,
    phone: a.phone,
    star_rating: null,
    avatar_url: a.personal_photo_url ?? null,
    created_at: a.approved_at ?? a.created_at,
    documents: [] as { driver_id: string; document_type: string; storage_path: string; file_name: string | null; verified: boolean }[],
    source: "application" as const,
    driver_number: a.driver_number as number,
  }));

  const list = [...fromApplications, ...fromProfiles];
  return NextResponse.json(list);
}

export async function PATCH(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const body = await req.json();
  const { id, star_rating, avatar_url } = body;
  if (!id) return NextResponse.json({ error: "Missing driver id" }, { status: 400 });
  const supabase = createServerSupabase();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (star_rating !== undefined) updates.star_rating = star_rating == null ? null : Number(star_rating);
  if (avatar_url !== undefined) updates.avatar_url = avatar_url || null;
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .eq("role", "driver")
    .select()
    .single();
  if (error) {
    console.error("[admin/drivers PATCH]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
