import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import type { JobReviewRow } from "@/lib/published-driver-reviews";

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, order_number, company_name, customer_driver_rating, customer_driver_comment, customer_driver_rated_at, customer_review_published, assigned_driver_application_id",
    )
    .not("customer_driver_rating", "is", null)
    .order("customer_driver_rated_at", { ascending: false, nullsFirst: false });

  if (error) {
    if (String(error.message).includes("customer_review_published") || String(error.message).includes("customer_driver_rated_at")) {
      return NextResponse.json(
        {
          error:
            "Database columns missing: run supabase/publish_customer_driver_reviews.sql in Supabase SQL Editor.",
          reviews: [],
        },
        { status: 500 },
      );
    }
    console.error("[admin/customer-reviews GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data || [];
  const appIds = [
    ...new Set(
      rows
        .map((j) => (j as { assigned_driver_application_id?: string | null }).assigned_driver_application_id)
        .filter((x): x is string => Boolean(x)),
    ),
  ];
  const appById: Record<string, { full_name: string | null; personal_photo_url: string | null }> = {};
  if (appIds.length > 0) {
    const { data: apps } = await supabase
      .from("driver_applications")
      .select("id, full_name, personal_photo_url")
      .in("id", appIds);
    for (const row of apps || []) {
      const r = row as { id: string; full_name: string | null; personal_photo_url: string | null };
      appById[r.id] = { full_name: r.full_name, personal_photo_url: r.personal_photo_url };
    }
  }

  const reviews: JobReviewRow[] = rows.map((j) => {
    const row = j as Omit<JobReviewRow, "driver_applications">;
    const aid = row.assigned_driver_application_id;
    return {
      ...row,
      driver_applications: aid && appById[aid] ? appById[aid] : null,
    };
  });
  return NextResponse.json({ reviews });
}
