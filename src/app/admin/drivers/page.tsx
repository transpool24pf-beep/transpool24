"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";

type Doc = { driver_id: string; document_type: string; storage_path: string; file_name: string | null; verified: boolean };
type Driver = {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  star_rating: number | null;
  avatar_url: string | null;
  created_at: string;
  documents: Doc[];
  source?: "profile" | "application";
  driver_number?: number | null;
  vehicle_plate?: string | null;
  suspended_at?: string | null;
  desired_note?: string | null;
  stats?: { jobs_count: number; total_paid_cents: number; customer_rating_avg: number | null };
};

export default function AdminDriversPage() {
  const router = useRouter();
  const { t } = useAdminLocale();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStar, setEditingStar] = useState<string | null>(null);

  const docLabel = (type: string) => t(`drivers.doc.${type}`) || type;

  useEffect(() => {
    fetch("/api/admin/drivers")
      .then((r) => r.json())
      .then((data) => setDrivers(Array.isArray(data) ? data : []))
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  }, []);

  const updateStarRating = (id: string, star_rating: number | null) => {
    const driver = drivers.find((d) => d.id === id);
    if (driver?.source === "application") return;
    setEditingStar(id);
    fetch("/api/admin/drivers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, star_rating }),
    })
      .then((r) => {
        if (r.ok) {
          setDrivers((prev) =>
            prev.map((d) => (d.id === id ? { ...d, star_rating } : d))
          );
        }
      })
      .finally(() => setEditingStar(null));
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-[#0d2137]">{t("drivers.title")}</h1>
      <div className="mb-6 rounded-xl border border-[var(--accent)]/30 bg-[#fff8f0] p-4">
        <p className="text-sm text-[#0d2137]/90">
          {t("drivers.hintBefore")}{" "}
          <Link href="/admin/driver-applications" className="font-semibold text-[var(--accent)] underline hover:no-underline">
            {t("drivers.hintLink")}
          </Link>
          . {t("drivers.hintAfter")}
        </p>
      </div>
      {loading ? (
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <p className="text-[#0d2137]/70">{t("common.loading")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {drivers.map((d) => (
            <div
              key={d.id}
              className={`rounded-xl border border-[#0d2137]/10 bg-white p-5 shadow-sm ${d.source === "application" ? "cursor-pointer transition hover:border-[var(--accent)]/30 hover:shadow-md" : ""}`}
              role={d.source === "application" ? "link" : undefined}
              onClick={d.source === "application" ? () => router.push(`/admin/driver-applications/${d.id}`) : undefined}
            >
              <div className="flex flex-wrap items-start gap-4">
                {d.avatar_url ? (
                  <img
                    src={d.avatar_url}
                    alt=""
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0d2137]/10 text-2xl text-[#0d2137]/50">
                    {t("common.none")}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-[#0d2137]">
                      {d.full_name || d.company_name || t("common.none")}
                    </p>
                    {d.source === "application" && (
                      <span className="rounded bg-[var(--accent)]/15 px-2 py-0.5 text-sm font-medium text-[var(--accent)]">
                        {d.driver_number != null
                          ? `${t("drivers.driverNo")} #${String(d.driver_number).padStart(5, "0")}`
                          : t("drivers.approvedNoNumber")}
                      </span>
                    )}
                    {d.suspended_at && (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-sm font-medium text-red-700">
                        {t("drivers.suspended")}
                      </span>
                    )}
                    {d.source === "application" && (
                      <Link
                        href={`/admin/driver-applications/${d.id}`}
                        className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t("drivers.openProfile")}
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-[#0d2137]/70" dir="ltr">
                    {d.email ?? t("common.none")}
                  </p>
                  <p className="text-sm text-[#0d2137]/70" dir="ltr">
                    {d.phone ?? t("common.none")}
                  </p>
                  {d.stats && (d.stats.jobs_count > 0 || d.stats.customer_rating_avg != null) && (
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#0d2137]/70">
                      <span>
                        <strong>{t("drivers.orders")}:</strong> {d.stats.jobs_count}
                      </span>
                      <span dir="ltr">
                        <strong>{t("drivers.paidOut")}:</strong> {(d.stats.total_paid_cents / 100).toFixed(2)} €
                      </span>
                      {d.stats.customer_rating_avg != null && (
                        <span className="text-amber-600">★ {(d.stats.customer_rating_avg).toFixed(1)}</span>
                      )}
                    </div>
                  )}
                  {d.source !== "application" && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-[#0d2137]/70">{t("drivers.stars")}:</span>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() =>
                            updateStarRating(d.id, d.star_rating === n ? null : n)
                          }
                          disabled={editingStar === d.id}
                          className={`text-lg ${(d.star_rating ?? 0) >= n ? "text-amber-500" : "text-[#0d2137]/30"}`}
                        >
                          ★
                        </button>
                      ))}
                      {editingStar === d.id && <span className="text-xs">…</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t border-[#0d2137]/10 pt-4">
                {d.source === "application" ? (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#0d2137]/80">
                    <span>
                      <strong>{t("common.name")}:</strong> {d.full_name || t("common.none")}
                    </span>
                    <span>
                      <strong>{t("drivers.plate")}:</strong> {d.vehicle_plate || t("common.none")}
                    </span>
                    <span>
                      <strong>{t("drivers.rating")}:</strong>{" "}
                      {(d.stats?.customer_rating_avg ?? d.star_rating) != null ? (
                        <span className="text-amber-600">
                          ★ {(d.stats?.customer_rating_avg ?? d.star_rating)?.toFixed(1)}
                        </span>
                      ) : (
                        t("common.none")
                      )}
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="mb-2 text-sm font-medium text-[#0d2137]/80">{t("drivers.documents")}</p>
                    {d.documents.length === 0 ? (
                      <p className="text-sm text-[#0d2137]/60">{t("drivers.noDocuments")}</p>
                    ) : (
                      <ul className="space-y-1 text-sm text-[#0d2137]/80">
                        {d.documents.map((doc, i) => (
                          <li key={i}>
                            {docLabel(doc.document_type)}: {doc.file_name ?? doc.storage_path}{" "}
                            {doc.verified && (
                              <span className="text-green-600">✓ {t("drivers.verified")}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && drivers.length === 0 && (
        <p className="text-[#0d2137]/70">{t("drivers.empty")}</p>
      )}
    </div>
  );
}
