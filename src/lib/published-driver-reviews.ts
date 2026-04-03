import type { HomepageDriverRow } from "@/lib/homepage-drivers-map";
import { mapHomepageDriverRow } from "@/lib/homepage-drivers-map";

/** Avoid collision with homepage_drivers.id (bigserial). */
const JOB_REVIEW_ID_BASE = 8_000_000_000;

export type JobReviewRow = {
  id: string;
  order_number: number | null;
  company_name: string;
  customer_driver_rating: number;
  customer_driver_comment: string | null;
  customer_driver_rated_at: string | null;
  customer_review_published?: boolean;
  assigned_driver_application_id: string | null;
  driver_applications: { full_name: string | null; personal_photo_url: string | null } | null;
};

function stableNumericIdFromUuid(jobId: string): number {
  const hex = jobId.replace(/-/g, "").slice(0, 12);
  const n = parseInt(hex, 16);
  return JOB_REVIEW_ID_BASE + (Number.isFinite(n) ? (n % 99_999_999) : 0);
}

export function mapJobReviewRowToCarouselDriver(row: JobReviewRow) {
  const driverName =
    (row.driver_applications?.full_name && row.driver_applications.full_name.trim()) || "Driver";
  const photo =
    (row.driver_applications?.personal_photo_url && row.driver_applications.personal_photo_url.trim()) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName)}&background=e85d04&color=fff&size=128`;
  const id =
    row.order_number != null && row.order_number > 0
      ? JOB_REVIEW_ID_BASE + row.order_number
      : stableNumericIdFromUuid(row.id);
  return {
    id,
    name: driverName,
    photo,
    rating: Math.min(5, Math.max(1, Math.round(Number(row.customer_driver_rating)))),
    comment: (row.customer_driver_comment && row.customer_driver_comment.trim()) || "",
    customerName: row.company_name?.trim() || "—",
    order: 0,
  };
}

/** Merge CMS homepage drivers (ordered) with published job reviews (newest first). */
export function mergeHomepageAndPublishedReviews(
  homepageRows: HomepageDriverRow[],
  jobRows: JobReviewRow[],
) {
  const cms = homepageRows.map((r) => mapHomepageDriverRow(r));
  const fromJobs = jobRows
    .slice()
    .sort((a, b) => {
      const ta = a.customer_driver_rated_at ? new Date(a.customer_driver_rated_at).getTime() : 0;
      const tb = b.customer_driver_rated_at ? new Date(b.customer_driver_rated_at).getTime() : 0;
      return tb - ta;
    })
    .map((r) => {
      const m = mapJobReviewRowToCarouselDriver(r);
      return {
        id: m.id,
        name: m.name,
        photo: m.photo,
        rating: m.rating,
        comment: m.comment,
        customerName: m.customerName,
      };
    });
  return [...cms, ...fromJobs];
}
