"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";
import type { JobReviewRow } from "@/lib/published-driver-reviews";

export default function AdminRatingsPage() {
  const { locale, t } = useAdminLocale();
  const isRtl = locale === "ar";
  const [reviews, setReviews] = useState<JobReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setApiError(null);
    fetch("/api/admin/customer-reviews")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) {
          setApiError(j?.error ?? "Error");
          setReviews(Array.isArray(j?.reviews) ? j.reviews : []);
          return;
        }
        setReviews(Array.isArray(j.reviews) ? j.reviews : []);
      })
      .catch(() => {
        setApiError(t("ratings.toggleError"));
        setReviews([]);
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const togglePublished = async (row: JobReviewRow, next: boolean) => {
    setTogglingId(row.id);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, customer_review_published: next }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j?.error ?? t("ratings.toggleError"));
        return;
      }
      setReviews((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, customer_review_published: next } : r)),
      );
    } catch {
      alert(t("ratings.toggleError"));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} lang={isRtl ? "ar" : "de"} className="text-start">
      <h1 className="mb-2 text-2xl font-bold text-[#0d2137]">{t("ratings.title")}</h1>
      <p className="mb-2 max-w-3xl text-sm text-[#0d2137]/75">{t("ratings.subtitle")}</p>
      <p className="mb-6 max-w-3xl text-xs text-[#0d2137]/60">{t("ratings.homepageHint")}</p>

      {apiError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>{apiError}</p>
          <p className="mt-1 text-xs text-amber-800/90">{t("ratings.dbHint")}</p>
        </div>
      )}

      {loading ? (
        <p className="text-[#0d2137]/70">{t("ratings.loading")}</p>
      ) : reviews.length === 0 ? (
        <p className="text-[#0d2137]/70">{t("ratings.none")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#0d2137]/10 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-[#0d2137]/10 bg-[#0d2137]/[0.04]">
              <tr>
                <th className="px-3 py-3 font-semibold text-[#0d2137]">{t("ratings.colOrder")}</th>
                <th className="px-3 py-3 font-semibold text-[#0d2137]">{t("ratings.colCompany")}</th>
                <th className="px-3 py-3 font-semibold text-[#0d2137]">{t("ratings.colDriver")}</th>
                <th className="px-3 py-3 font-semibold text-[#0d2137]">{t("ratings.colStars")}</th>
                <th className="px-3 py-3 font-semibold text-[#0d2137]">{t("ratings.colComment")}</th>
                <th className="px-3 py-3 font-semibold text-[#0d2137]">{t("ratings.colSite")}</th>
                <th className="px-3 py-3 font-semibold text-[#0d2137]">{t("ratings.openOrder")}</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => {
                const driverLabel =
                  (r.driver_applications?.full_name && r.driver_applications.full_name.trim()) || "—";
                const pub = Boolean(r.customer_review_published);
                return (
                  <tr key={r.id} className="border-b border-[#0d2137]/5">
                    <td className="px-3 py-3 font-mono text-[#0d2137]">
                      {r.order_number ?? r.id.slice(0, 8)}
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-3 text-[#0d2137]/90" title={r.company_name}>
                      {r.company_name || "—"}
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-3 text-[#0d2137]/90" title={driverLabel}>
                      {driverLabel}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-amber-600">
                      {"★".repeat(Math.round(r.customer_driver_rating))}
                      <span className="sr-only">{r.customer_driver_rating}</span>
                    </td>
                    <td className="max-w-[220px] px-3 py-3 text-[#0d2137]/85">
                      <span className="line-clamp-2">{r.customer_driver_comment?.trim() || "—"}</span>
                    </td>
                    <td className="px-3 py-3">
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={pub}
                          disabled={togglingId === r.id}
                          onChange={(e) => togglePublished(r, e.target.checked)}
                          className="h-4 w-4 rounded border-[#0d2137]/30"
                        />
                        <span className="text-xs text-[#0d2137]/70">{pub ? t("ratings.siteOn") : t("ratings.siteOff")}</span>
                      </label>
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/orders/${r.id}`}
                        className="text-sm font-medium text-[var(--accent)] hover:underline"
                      >
                        {t("ratings.openOrder")}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
