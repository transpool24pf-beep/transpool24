"use client";

import { useEffect, useState } from "react";

type Job = {
  id: string;
  company_name: string;
  phone: string;
  customer_email: string | null;
  pickup_address: string;
  delivery_address: string;
  cargo_size: string;
  distance_km: number | null;
  price_cents: number;
  payment_status: string;
  logistics_status: string;
  created_at: string;
  preferred_pickup_at: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  confirmed: "Confirmed / قيد الانتظار",
  paid: "Paid",
  assigned: "Assigned / قيد التنفيذ",
  in_transit: "In transit",
  delivered: "Delivered / تم التسليم",
  cancelled: "Cancelled",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [sending, setSending] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = (id: string, logistics_status: string) => {
    setUpdating(id);
    fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, logistics_status }),
    })
      .then((r) => {
        if (r.ok) {
          setOrders((prev) =>
            prev.map((o) => (o.id === id ? { ...o, logistics_status } : o))
          );
        }
      })
      .finally(() => setUpdating(null));
  };

  const sendEmail = (id: string) => {
    setSending(id);
    fetch("/api/admin/send-order-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: id }),
    })
      .then((r) => {
        if (r.ok) alert("Email sent.");
        else r.json().then((d) => alert(d.error || "Failed to send."));
      })
      .catch(() => alert("Request failed"))
      .finally(() => setSending(null));
  };

  const filtered = filter
    ? orders.filter((o) => o.logistics_status === filter)
    : orders;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-[#0d2137]">Orders / الطلبات</h1>
      <div className="mb-4 flex gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <p className="text-[#0d2137]/70">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#0d2137]/15 bg-white shadow">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b bg-[#0d2137]/5">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-[#0d2137]/10 last:border-0">
                  <td className="px-4 py-3 text-[#0d2137]/80">
                    {new Date(o.created_at).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-4 py-3">{o.company_name}</td>
                  <td className="px-4 py-3 text-[#0d2137]/80">{o.customer_email ?? "—"}</td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-[#0d2137]/80" title={`${o.pickup_address} → ${o.delivery_address}`}>
                    {o.pickup_address} → {o.delivery_address}
                  </td>
                  <td className="px-4 py-3">€ {(o.price_cents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3">{o.payment_status}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.logistics_status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      disabled={updating === o.id}
                      className="rounded border border-[#0d2137]/20 bg-white px-2 py-1 text-xs"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {o.customer_email && (
                      <button
                        type="button"
                        onClick={() => sendEmail(o.id)}
                        disabled={sending === o.id}
                        className="rounded bg-[var(--accent)] px-2 py-1 text-xs text-white hover:opacity-90 disabled:opacity-60"
                      >
                        {sending === o.id ? "…" : "Send email"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <p className="mt-4 text-[#0d2137]/70">No orders found.</p>
      )}
    </div>
  );
}
