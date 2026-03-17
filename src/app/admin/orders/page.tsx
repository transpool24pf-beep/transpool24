"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  driver_price_cents: number | null;
  payment_status: string;
  logistics_status: string;
  created_at: string;
  preferred_pickup_at: string | null;
  confirmation_token: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "مسودة / Draft", color: "text-slate-700", bg: "bg-slate-400" },
  confirmed: { label: "قيد الانتظار / Confirmed", color: "text-blue-700", bg: "bg-blue-500" },
  paid: { label: "مدفوع / Paid", color: "text-emerald-700", bg: "bg-emerald-500" },
  assigned: { label: "قيد التنفيذ / Assigned", color: "text-amber-700", bg: "bg-amber-500" },
  in_transit: { label: "في الطريق / In transit", color: "text-violet-700", bg: "bg-violet-500" },
  delivered: { label: "تم التسليم / Delivered", color: "text-green-700", bg: "bg-green-500" },
  cancelled: { label: "ملغي / Cancelled", color: "text-red-700", bg: "bg-red-500" },
};

const DRIVER_INVOICE_DEFAULT_EUR = 18;

function buildWhatsAppMessage(o: Job): string {
  const driverPrice = o.driver_price_cents != null ? (o.driver_price_cents / 100).toFixed(2) : DRIVER_INVOICE_DEFAULT_EUR.toFixed(2);
  const lines = [
    "🚚 TransPool24 – طلب للنقل",
    "",
    `📋 رقم الطلب: ${o.id}`,
    `🏢 الشركة: ${o.company_name}`,
    `📞 الهاتف: ${o.phone}`,
    o.customer_email ? `📧 البريد: ${o.customer_email}` : null,
    "",
    "📍 الاستلام:",
    o.pickup_address,
    "",
    "📍 التسليم:",
    o.delivery_address,
    "",
    `📦 الحمولة: ${o.cargo_size} | المسافة: ${o.distance_km ?? "—"} km`,
    `💰 سعر السائق/المجموعة: ${driverPrice} EUR`,
    `📅 التاريخ: ${new Date(o.created_at).toLocaleDateString("de-DE")}`,
  ].filter(Boolean);
  return lines.join("\n");
}

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

  const updateDriverPrice = (id: string, eurValue: string) => {
    const trimmed = eurValue.trim();
    const cents = trimmed === "" ? null : Math.round(parseFloat(trimmed.replace(",", ".")) * 100);
    if (cents !== null && (Number.isNaN(cents) || cents < 0)) return;
    fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, driver_price_cents: cents }),
    })
      .then((r) => {
        if (r.ok) {
          setOrders((prev) =>
            prev.map((o) => (o.id === id ? { ...o, driver_price_cents: cents } : o))
          );
        }
      });
  };

  const sendEmail = (id: string) => {
    setSending(id);
    fetch("/api/admin/send-order-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: id }),
    })
      .then((r) => {
        if (r.ok) alert("تم إرسال البريد.");
        else r.json().then((d) => alert(d.error || "فشل الإرسال."));
      })
      .catch(() => alert("فشل الطلب"))
      .finally(() => setSending(null));
  };

  const openWhatsApp = (o: Job) => {
    const text = buildWhatsAppMessage(o);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const downloadInvoice = (jobId: string, type: "customer" | "driver") => {
    window.open(`/api/admin/invoice?job_id=${encodeURIComponent(jobId)}&type=${type}`, "_blank");
  };

  const filtered = filter
    ? orders.filter((o) => o.logistics_status === filter)
    : orders;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0d2137]">الطلبات / Orders</h1>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border-2 border-[#0d2137]/15 bg-white px-4 py-2.5 text-sm font-medium text-[#0d2137] shadow-sm transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
        >
          <option value="">كل الحالات / All statuses</option>
          {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-10 shadow-lg">
          <p className="text-[#0d2137]/70">جاري التحميل…</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border-2 border-[#0d2137]/10 bg-white shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b-2 border-[#0d2137]/10 bg-gradient-to-r from-[#0d2137]/10 to-[#0d2137]/5">
                  <th className="px-5 py-4 font-semibold text-[#0d2137]">الحالة</th>
                  <th className="px-5 py-4 font-semibold text-[#0d2137]">التاريخ</th>
                  <th className="px-5 py-4 font-semibold text-[#0d2137]">الشركة</th>
                  <th className="px-5 py-4 font-semibold text-[#0d2137]">البريد</th>
                  <th className="px-5 py-4 font-semibold text-[#0d2137]">الطريق</th>
                  <th className="px-5 py-4 font-semibold text-[#0d2137]">سعر العميل</th>
                  <th className="px-5 py-4 font-semibold text-[#0d2137]">سعر السائق</th>
                  <th className="px-5 py-4 font-semibold text-[#0d2137]">الدفع</th>
                  <th className="px-5 py-4 font-semibold text-[#0d2137]">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, idx) => {
                  const statusConf = STATUS_CONFIG[o.logistics_status] ?? STATUS_CONFIG.draft;
                  return (
                    <tr
                      key={o.id}
                      className={`border-b border-[#0d2137]/5 transition hover:bg-[#0d2137]/[0.02] ${
                        idx % 2 === 1 ? "bg-[#0d2137]/[0.02]" : ""
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block h-3 w-3 shrink-0 rounded-full ${statusConf.bg}`}
                            title={statusConf.label}
                          />
                          <select
                            value={o.logistics_status}
                            onChange={(e) => updateStatus(o.id, e.target.value)}
                            disabled={updating === o.id}
                            className={`rounded-lg border-2 bg-white px-2 py-1.5 text-xs font-medium ${statusConf.color} focus:border-[var(--accent)] focus:outline-none`}
                          >
                            {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[#0d2137]/80">
                        {new Date(o.created_at).toLocaleDateString("de-DE")}
                      </td>
                      <td className="px-5 py-3 font-medium text-[#0d2137]">
                        {o.company_name}
                      </td>
                      <td className="max-w-[160px] truncate px-5 py-3 text-[#0d2137]/80" title={o.customer_email ?? ""}>
                        {o.customer_email ?? "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-5 py-3 text-[#0d2137]/80" title={`${o.pickup_address} → ${o.delivery_address}`}>
                        {o.pickup_address} → {o.delivery_address}
                      </td>
                      <td className="px-5 py-3 font-semibold text-[#0d2137]">
                        € {(o.price_cents / 100).toFixed(2)}
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="text"
                          defaultValue={o.driver_price_cents != null ? (o.driver_price_cents / 100).toFixed(2).replace(".", ",") : ""}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v) updateDriverPrice(o.id, v);
                          }}
                          placeholder="—"
                          className="w-20 rounded border border-[#0d2137]/20 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            o.payment_status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {o.payment_status === "paid" ? "مدفوع" : "قيد الانتظار"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="inline-flex items-center justify-center rounded-lg bg-[#0d2137] px-3 py-2 text-xs font-medium text-white hover:bg-[#0d2137]/90"
                          >
                            فتح الطلب
                          </Link>
                          <button
                            type="button"
                            onClick={() => openWhatsApp(o)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#20bd5a]"
                          >
                            واتساب للمجموعة
                          </button>
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => downloadInvoice(o.id, "driver")}
                              className="rounded-lg border-2 border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
                            >
                              فاتورة المجموعة
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadInvoice(o.id, "customer")}
                              className="rounded-lg border-2 border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-100"
                            >
                              فاتورة العميل
                            </button>
                          </div>
                          {o.customer_email && (
                            <button
                              type="button"
                              onClick={() => sendEmail(o.id)}
                              disabled={sending === o.id}
                              className="rounded-lg bg-[var(--accent)] px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                            >
                              {sending === o.id ? "…" : "إرسال بريد"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-[#0d2137]/70 shadow-lg">
          لا توجد طلبات.
        </p>
      )}
    </div>
  );
}
