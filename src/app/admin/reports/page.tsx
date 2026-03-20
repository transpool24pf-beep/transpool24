"use client";

import { useEffect, useState } from "react";

type ReportPayload = {
  totalOrders: number;
  revenueEur: string;
  byStatus: Record<string, number>;
  assignedCount: number;
  deliveredCount: number;
  cancelledCount: number;
  cancelRatePercent: string;
};

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((r) => {
        if (!r.ok) return r.json().then((j) => { throw new Error(j.error || r.statusText); });
        return r.json();
      })
      .then((j: ReportPayload) => setData(j))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-10 shadow-lg">
        <p className="text-[#0d2137]/70">Laden…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-red-800">
        {error ?? "Keine Daten"}
      </div>
    );
  }

  const statusEntries = Object.entries(data.byStatus).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0d2137]">Kurzberichte</h1>
      <p className="text-sm text-[#0d2137]/70">
        Aggregierte Zahlen aus der Auftragstabelle – später erweiterbar (pro Fahrer, Reaktionszeit usw.).
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#0d2137]/50">Aufträge gesamt</p>
          <p className="mt-1 text-3xl font-bold text-[#0d2137]">{data.totalOrders}</p>
        </div>
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/70">Umsatz (ca.)</p>
          <p className="mt-1 text-3xl font-bold text-emerald-900">€ {data.revenueEur}</p>
          <p className="mt-1 text-xs text-emerald-800/70">ohne Entwürfe / storniert in der Summe</p>
        </div>
        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-800/70">Mit Fahrer</p>
          <p className="mt-1 text-3xl font-bold text-blue-900">{data.assignedCount}</p>
        </div>
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-900/70">Stornoquote</p>
          <p className="mt-1 text-3xl font-bold text-amber-900">{data.cancelRatePercent}%</p>
          <p className="mt-1 text-xs text-amber-900/60">Storniert: {data.cancelledCount}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">Nach logistics_status</h2>
          <ul className="space-y-2 text-sm">
            {statusEntries.map(([st, n]) => (
              <li key={st} className="flex justify-between border-b border-[#0d2137]/10 py-2 last:border-0">
                <span className="font-mono text-[#0d2137]/80">{st}</span>
                <span className="font-semibold text-[#0d2137]">{n}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">Zustellung</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#0d2137]/60">Zugestellt</dt>
              <dd className="font-semibold text-green-800">{data.deliveredCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#0d2137]/60">Storniert</dt>
              <dd className="font-semibold text-red-800">{data.cancelledCount}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
