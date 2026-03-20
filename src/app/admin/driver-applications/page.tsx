"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const [list, setList] = useState<DriverApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setApiError(null);
    fetch("/api/admin/driver-applications")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setApiError(data?.error || "Ladefehler");
          return [];
        }
        return Array.isArray(data) ? data : [];
      })
      .then(setList)
      .catch(() => {
        setApiError("Verbindungsfehler. Site und Datenbank prüfen.");
        setList([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-[#0d2137]">Fahrerbewerbungen</h1>
      {apiError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {apiError} — SQL in Supabase ausführen: add_driver_applications.sql, add_driver_application_fields.sql,
          add_driver_application_approve_reject.sql
        </div>
      )}
      {loading ? (
        <p className="text-[#0d2137]/70">Laden…</p>
      ) : list.length === 0 ? (
        <p className="text-[#0d2137]/70">
          Noch keine Bewerbungen. Eingaben von der Fahrer-Seite erscheinen hier nach dem Absenden.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#0d2137]/10 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-[#0d2137]/10 bg-[#0d2137]/5">
                <th className="p-3 text-sm font-semibold text-[#0d2137]">Name</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]">E-Mail</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]">Telefon</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]">Stadt</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]">Status</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]">Datum</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((app) => (
                <tr key={app.id} className="border-b border-[#0d2137]/5 hover:bg-[#0d2137]/[0.02]">
                  <td className="p-3 text-sm text-[#0d2137]">{app.full_name}</td>
                  <td className="p-3 text-sm text-[#0d2137]/80">{app.email}</td>
                  <td className="p-3 text-sm text-[#0d2137]/80">{app.phone}</td>
                  <td className="p-3 text-sm text-[#0d2137]/80">{app.city}</td>
                  <td className="p-3 text-sm text-[#0d2137]/80">
                    {app.status === "new"
                      ? "Neu"
                      : app.status === "approved"
                        ? "Genehmigt"
                        : app.status === "rejected"
                          ? "Abgelehnt"
                          : app.status}
                  </td>
                  <td className="p-3 text-sm text-[#0d2137]/70">
                    {new Date(app.created_at).toLocaleDateString("de-DE")}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/driver-applications/${app.id}`}
                      className="rounded-lg bg-[var(--accent)]/10 px-3 py-1.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20"
                    >
                      Öffnen
                    </Link>
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
