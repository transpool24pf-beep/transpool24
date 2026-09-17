"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";

type DriverApp = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  status: string;
  vehicle_plate: string | null;
  languages_spoken: string | null;
  created_at: string;
};

export default function AdminDriverApplicationsPage() {
  const { locale, t } = useAdminLocale();
  const dateLocale = locale === "ar" ? "ar-SA" : "de-DE";
  const [list, setList] = useState<DriverApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const statusLabel = (status: string) => {
    if (status === "new") return t("driverApps.status.new");
    if (status === "approved") return t("driverApps.status.approved");
    if (status === "rejected") return t("driverApps.status.rejected");
    return status;
  };

  useEffect(() => {
    setApiError(null);
    fetch("/api/admin/driver-applications")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setApiError(data?.error || t("driverApps.loadError"));
          return [];
        }
        return Array.isArray(data) ? data : [];
      })
      .then(setList)
      .catch(() => {
        setApiError(t("driverApps.connectionError"));
        setList([]);
      })
      .finally(() => setLoading(false));
  }, [t]);

  const deleteApp = (app: DriverApp) => {
    const msg = t("driverApps.deleteConfirm").replace("{name}", app.full_name || app.email || app.id.slice(0, 8));
    if (!window.confirm(msg)) return;
    setDeleting(app.id);
    fetch(`/api/admin/driver-applications/${app.id}`, { method: "DELETE" })
      .then(async (r) => {
        if (!r.ok) {
          const data = (await r.json().catch(() => ({}))) as { error?: string };
          alert(data?.error ?? t("driverApps.deleteFailed"));
          return;
        }
        setList((prev) => prev.filter((x) => x.id !== app.id));
      })
      .catch(() => alert(t("driverApps.deleteFailed")))
      .finally(() => setDeleting(null));
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-[#0d2137]">{t("driverApps.title")}</h1>
      {apiError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {apiError}, {t("driverApps.sqlHint")}
        </div>
      )}
      {loading ? (
        <p className="text-[#0d2137]/70">{t("common.loading")}</p>
      ) : list.length === 0 ? (
        <p className="text-[#0d2137]/70">{t("driverApps.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#0d2137]/10 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-start">
            <thead>
              <tr className="border-b border-[#0d2137]/10 bg-[#0d2137]/5">
                <th className="p-3 text-sm font-semibold text-[#0d2137]">{t("common.name")}</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]">{t("common.email")}</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]">{t("common.phone")}</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]">{t("driverApps.colCity")}</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]">{t("common.status")}</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]">{t("common.date")}</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((app) => (
                <tr key={app.id} className="border-b border-[#0d2137]/5 hover:bg-[#0d2137]/[0.02]">
                  <td className="p-3 text-sm text-[#0d2137]">{app.full_name}</td>
                  <td className="p-3 text-sm text-[#0d2137]/80" dir="ltr">
                    {app.email}
                  </td>
                  <td className="p-3 text-sm text-[#0d2137]/80" dir="ltr">
                    {app.phone}
                  </td>
                  <td className="p-3 text-sm text-[#0d2137]/80">{app.city}</td>
                  <td className="p-3 text-sm text-[#0d2137]/80">{statusLabel(app.status)}</td>
                  <td className="p-3 text-sm text-[#0d2137]/70">
                    {new Date(app.created_at).toLocaleDateString(dateLocale)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/driver-applications/${app.id}`}
                        className="rounded-lg bg-[var(--accent)]/10 px-3 py-1.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20"
                      >
                        {t("common.open")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteApp(app)}
                        disabled={deleting === app.id}
                        title={t("driverApps.deleteAria")}
                        aria-label={t("driverApps.deleteAria")}
                        className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-red-300 bg-red-50 text-lg font-bold leading-none text-red-700 shadow-sm transition hover:border-red-400 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <span aria-hidden className="-mt-px block">
                          ×
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
