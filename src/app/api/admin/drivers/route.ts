import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const supabase = createServerSupabase();
  const { data: profiles, error: profError } = await supabase
    .from("profiles")
    .select("id, email, full_name, company_name, phone, role, star_rating, avatar_url, created_at, suspended_at")
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

  const { data: allJobs } = await supabase
    .from("jobs")
    .select("assigned_driver_id, assigned_driver_application_id, driver_price_cents, customer_driver_rating");
  type Stat = { jobs_count: number; total_paid_cents: number; rating_sum: number; rating_n: number };
  const profileStatsRaw: Record<string, Stat> = {};
  const appStatsRaw: Record<string, Stat> = {};
  (allJobs ?? []).forEach((j) => {
    const price = Number(j.driver_price_cents) || 0;
    const rating = (j as { customer_driver_rating?: number }).customer_driver_rating;
    if (j.assigned_driver_id) {
      const k = j.assigned_driver_id;
      if (!profileStatsRaw[k]) profileStatsRaw[k] = { jobs_count: 0, total_paid_cents: 0, rating_sum: 0, rating_n: 0 };
      profileStatsRaw[k].jobs_count += 1;
      profileStatsRaw[k].total_paid_cents += price;
      if (rating != null) {
        profileStatsRaw[k].rating_sum += rating;
        profileStatsRaw[k].rating_n += 1;
      }
    }
    if (j.assigned_driver_application_id) {
      const k = j.assigned_driver_application_id;
      if (!appStatsRaw[k]) appStatsRaw[k] = { jobs_count: 0, total_paid_cents: 0, rating_sum: 0, rating_n: 0 };
      appStatsRaw[k].jobs_count += 1;
      appStatsRaw[k].total_paid_cents += price;
      if (rating != null) {
        appStatsRaw[k].rating_sum += rating;
        appStatsRaw[k].rating_n += 1;
      }
    }
  });
  const profileStats: Record<string, { jobs_count: number; total_paid_cents: number; customer_rating_avg: number | null }> = {};
  const appStats: Record<string, { jobs_count: number; total_paid_cents: number; customer_rating_avg: number | null }> = {};
  Object.entries(profileStatsRaw).forEach(([k, s]) => {
    profileStats[k] = {
      jobs_count: s.jobs_count,
      total_paid_cents: s.total_paid_cents,
      customer_rating_avg: s.rating_n > 0 ? s.rating_sum / s.rating_n : null,
    };
  });
  Object.entries(appStatsRaw).forEach(([k, s]) => {
    appStats[k] = {
      jobs_count: s.jobs_count,
      total_paid_cents: s.total_paid_cents,
      customer_rating_avg: s.rating_n > 0 ? s.rating_sum / s.rating_n : null,
    };
  });

  const fromProfiles = (profiles ?? []).map((p) => {
    const stats = profileStats[p.id] ?? { jobs_count: 0, total_paid_cents: 0, customer_rating_avg: null };
    return {
      ...p,
      documents: byDriver[p.id] ?? [],
      source: "profile" as const,
      driver_number: null as number | null,
      stats,
      suspended_at: (p as { suspended_at?: string | null }).suspended_at ?? null,
    };
  });

  const { data: approvedApps } = await supabase
    .from("driver_applications")
    .select("id, full_name, email, phone, city, driver_number, vehicle_plate, personal_photo_url, approved_at, created_at, suspended_at, star_rating, desired_note")
    .eq("status", "approved")
    .order("driver_number", { ascending: true });
  const fromApplications = (approvedApps ?? []).map((a) => {
    const stats = appStats[a.id] ?? { jobs_count: 0, total_paid_cents: 0, customer_rating_avg: null };
    return {
      id: a.id,
      email: a.email,
      full_name: a.full_name,
      company_name: null,
      phone: a.phone,
      star_rating: a.star_rating ?? null,
      avatar_url: a.personal_photo_url ?? null,
      created_at: a.approved_at ?? a.created_at,
      documents: [] as { driver_id: string; document_type: string; storage_path: string; file_name: string | null; verified: boolean }[],
      source: "application" as const,
      driver_number: a.driver_number ?? null,
      vehicle_plate: a.vehicle_plate ?? null,
      suspended_at: a.suspended_at ?? null,
      desired_note: a.desired_note ?? null,
      stats,
    };
  });

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
