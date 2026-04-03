import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { mapHomepageDriverRow, type HomepageDriverRow } from "@/lib/homepage-drivers-map";
import { mergeHomepageAndPublishedReviews, type JobReviewRow } from "@/lib/published-driver-reviews";

/** Always fresh list so CMS additions show after refresh without stale CDN cache. */
export const dynamic = "force-dynamic";

// Public API for fetching drivers (used by homepage)
export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("homepage_drivers")
      .select("*")
      .order("order", { ascending: true });

    if (error) throw error;

    const homepageRows = (data || []) as HomepageDriverRow[];

    let jobRows: JobReviewRow[] = [];
    const { data: published, error: pubErr } = await supabase
      .from("jobs")
      .select(
        "id, order_number, company_name, customer_driver_rating, customer_driver_comment, customer_driver_rated_at, assigned_driver_application_id",
      )
      .eq("customer_review_published", true)
      .not("customer_driver_rating", "is", null);

    if (!pubErr && published?.length) {
      const appIds = [
        ...new Set(
          published
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
          const r = row as {
            id: string;
            full_name: string | null;
            personal_photo_url: string | null;
          };
          appById[r.id] = { full_name: r.full_name, personal_photo_url: r.personal_photo_url };
        }
      }
      jobRows = published.map((j) => {
        const row = j as Omit<JobReviewRow, "driver_applications">;
        const aid = row.assigned_driver_application_id;
        return {
          ...row,
          driver_applications: aid && appById[aid] ? appById[aid] : null,
        };
      });
    } else if (pubErr) {
      if (String(pubErr.message).includes("customer_review_published")) {
        /* migration not applied — skip published block */
      } else {
        console.warn("[public/content/drivers] published reviews skip:", pubErr.message);
      }
    }

    const drivers = mergeHomepageAndPublishedReviews(homepageRows, jobRows);

    return NextResponse.json(
      { drivers },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("[public/content/drivers GET]", error);
    return NextResponse.json(
      { drivers: [] },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
