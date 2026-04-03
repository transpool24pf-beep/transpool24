"use client";

import { useEffect, useState } from "react";

type PaidInvoiceRow = {
  id: string;
  order_number: number | null;
  company_name: string;
  price_cents: number;
  created_at: string;
};

type ReportPayload = {
  totalOrders: number;
  revenueEur: string;
  byStatus: Record<string, number>;
  assignedCount: number;
  deliveredCount: number;
  cancelledCount: number;
  cancelRatePercent: string;
  paidOrderCount: number;
  paidRevenueEur: string;
  byPayment: Record<string, number>;
  paidInvoices?: PaidInvoiceRow[];
  inTransitCount?: number;
  supportTickets7d?: number;
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
  const paidList = data.paidInvoices ?? [];

  return (
    <div dir="ltr" lang="de" className="space-y-6 text-start">
      <h1 className="text-2xl font-bold text-[#0d2137]">Kurzberichte</h1>
      <p className="text-sm text-[#0d2137]/70">
        Aggregierte Zahlen aus der Auftragstabelle. Bei <strong>Zahlungsstatus bezahlt</strong> können Sie die
        Kundenrechnung als PDF öffnen (enthält „Zahlungsstatus: Bezahlt“ und ggf. Liefernachweis-Datum).
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#0d2137]/50">Aufträge gesamt</p>
          <p className="mt-1 text-3xl font-bold text-[#0d2137]">{data.totalOrders}</p>
        </div>
        <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/50 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-900/70">Unterwegs (in_transit)</p>
          <p className="mt-1 text-3xl font-bold text-violet-900">{data.inTransitCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/50 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-700/70">Support (7 Tage)</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{data.supportTickets7d ?? 0}</p>
          <p className="mt-1 text-xs text-slate-600/80">Einträge in support_requests</p>
        </div>
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/70">Umsatz (ca.)</p>
          <p className="mt-1 text-3xl font-bold text-emerald-900">€ {data.revenueEur}</p>
          <p className="mt-1 text-xs text-emerald-800/70">ohne Entwürfe / storniert in der Summe</p>
        </div>
        <div className="rounded-2xl border-2 border-teal-200 bg-teal-50/50 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-900/70">Bezahlt (bestätigt)</p>
          <p className="mt-1 text-3xl font-bold text-teal-900">{data.paidOrderCount ?? 0}</p>
          <p className="mt-1 text-xs text-teal-900/70">Summe Kundenpreis: € {data.paidRevenueEur ?? "0.00"}</p>
          <p className="mt-1 text-xs text-teal-800/60">Zahlungsstatus „bezahlt“, nicht storniert</p>
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

      <div className="rounded-2xl border-2 border-teal-300 bg-white p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold text-[#0d2137]">Kundenrechnungen (PDF) – bezahlt</h2>
        <p className="mb-4 text-sm text-[#0d2137]/70">
          Direkter Download der Systemrechnung (wie unter Aufträge). Nur Aufträge mit{" "}
          <code className="rounded bg-[#0d2137]/10 px-1">payment_status = paid</code>, nicht storniert – bis zu 100
          neueste.
        </p>
        {paidList.length === 0 ? (
          <p className="text-sm text-[#0d2137]/60">Keine bezahlten Aufträge in der Liste.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#0d2137]/15">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-[#0d2137]/15 bg-[#0d2137]/[0.04] text-left">
                  <th className="px-3 py-2.5 font-semibold text-[#0d2137]">Nr.</th>
                  <th className="px-3 py-2.5 font-semibold text-[#0d2137]">Firma</th>
                  <th className="px-3 py-2.5 font-semibold text-[#0d2137]">Datum</th>
                  <th className="px-3 py-2.5 font-semibold text-[#0d2137]">Betrag</th>
                  <th className="px-3 py-2.5 font-semibold text-[#0d2137]">PDF</th>
                </tr>
              </thead>
              <tbody>
                {paidList.map((row) => (
                  <tr key={row.id} className="border-b border-[#0d2137]/10 hover:bg-[#0d2137]/[0.02]">
                    <td className="px-3 py-2 font-mono font-medium">{row.order_number ?? row.id.slice(0, 8)}</td>
                    <td className="max-w-[200px] truncate px-3 py-2" title={row.company_name}>
                      {row.company_name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#0d2137]/80">
                      {new Date(row.created_at).toLocaleDateString("de-DE")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-medium">€ {(row.price_cents / 100).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <a
                        href={`/api/admin/invoice?job_id=${encodeURIComponent(row.id)}&type=customer`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                      >
                        PDF (bezahlt)
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

      <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">Nach Zahlungsstatus (payment_status)</h2>
        <ul className="space-y-2 text-sm">
          {Object.entries(data.byPayment ?? {})
            .sort((a, b) => b[1] - a[1])
            .map(([st, n]) => (
              <li key={st} className="flex justify-between border-b border-[#0d2137]/10 py-2 last:border-0">
                <span className="font-mono text-[#0d2137]/80">{st}</span>
                <span className="font-semibold text-[#0d2137]">{n}</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
