"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Job = {
  id: string;
  order_number: number | null;
  company_name: string;
  phone: string;
  customer_email: string | null;
  pickup_address: string;
  delivery_address: string;
  cargo_size: string;
  cargo_details: Record<string, unknown> | null;
  service_type?: string;
  distance_km: number | null;
  price_cents: number;
  driver_price_cents: number | null;
  payment_status: string;
  logistics_status: string;
  created_at: string;
  preferred_pickup_at: string | null;
  confirmation_token: string | null;
  assigned_driver_application_id?: string | null;
};

type DriverOption = {
  id: string;
  full_name: string;
  driver_number: number | null;
  source: string;
};

/** سعر السائق: إما المحفوظ أو 18 × مسافة الذهاب والإياب (بالمليم) */
function getDriverPriceEur(o: Job): string {
  if (o.driver_price_cents != null) return (o.driver_price_cents / 100).toFixed(2);
  if (o.distance_km != null && o.distance_km > 0) return ((18 * o.distance_km * 2) / 100).toFixed(2);
  return "18.00";
}

/** نوع النقل بالعربية */
function serviceTypeLabelAr(st: string | undefined): string {
  if (st === "driver_only") return "سائق فقط";
  if (st === "driver_car_assistant") return "سائق مع سيارة ومعاون";
  return "سائق مع سيارة";
}

/** حجم البضاعة من cargo_details */
function cargoVolumeStr(cd: Record<string, unknown> | null): string | null {
  if (!cd) return null;
  const l = cd.cargoLengthCm ?? cd.lengthCm;
  const w = cd.cargoWidthCm ?? cd.widthCm;
  const h = cd.cargoHeightCm ?? cd.heightCm;
  if (l != null && w != null && h != null) return `${l} × ${w} × ${h} cm`;
  return null;
}

const IC = {
  megaphone: "\u{1F4E2}",
  clipboard: "\u{1F4CB}",
  phone: "\u{1F4DE}",
  clock: "\u{1F556}",
  calendar: "\u{1F4C5}",
  ruler: "\u{1F4CF}",
  truck: "\u{1F69A}",
  package: "\u{1F4E6}",
  scale: "\u2696\uFE0F",
  lorry: "\u{1F69B}",
  building: "\u{1F3E2}",
  pin: "\u{1F4CD}",
  money: "\u{1F4B0}",
  worker: "\u{1F477}",
};

/** رسالة واتساب للمجموعة: كل المعلومات مع سعر السائق وسعر المعاون إن وجد، بأيقونات وسطر فارغ */
function buildWhatsAppMessage(o: Job): string {
  const orderRef = o.order_number != null ? String(o.order_number) : o.id;
  const driverEur = getDriverPriceEur(o);
  const assistantEur = "16.30";
  const hasAssistant = o.service_type === "driver_car_assistant";
  const timeStr = o.preferred_pickup_at
    ? new Date(o.preferred_pickup_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    : null;
  const dateStr = o.preferred_pickup_at
    ? new Date(o.preferred_pickup_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : null;
  const weightKg = o.cargo_details && typeof o.cargo_details.weightKg === "number"
    ? o.cargo_details.weightKg
    : o.cargo_details && typeof (o.cargo_details as { cargoWeightKg?: number }).cargoWeightKg === "number"
      ? (o.cargo_details as { cargoWeightKg: number }).cargoWeightKg
      : null;
  const distanceStr = o.distance_km != null ? `${o.distance_km} km` : "—";
  const volumeStr = cargoVolumeStr(o.cargo_details);
  const serviceLabel = serviceTypeLabelAr(o.service_type);
  const blocks: string[] = [
    `${IC.megaphone} TransPool24 – طلب للنقل`,
    "",
    `${IC.clipboard} رقم الطلب: ${orderRef}`,
    "",
    `${IC.phone} الهاتف: ${o.phone}`,
    "",
    ...(timeStr ? [`${IC.clock} وقت (للحضور): ${timeStr}`] : []),
    ...(dateStr ? [`${IC.calendar} التاريخ: ${dateStr}`] : []),
    ...(timeStr || dateStr ? [""] : []),
    `${IC.ruler} المسافة: ${distanceStr}`,
    "",
    `${IC.truck} الحمولة: ${o.cargo_size}`,
    ...(volumeStr ? [`${IC.package} حجم البضاعة: ${volumeStr}`] : []),
    ...(weightKg != null ? [`${IC.scale} الوزن: ${weightKg} kg`] : []),
    `${IC.lorry} نوع النقل: ${serviceLabel}`,
    `${IC.building} الشركة: ${o.company_name}`,
    "",
    `${IC.pin} الاستلام:`,
    o.pickup_address,
    "",
    `${IC.pin} التسليم:`,
    o.delivery_address,
    "",
    `${IC.money} سعر السائق: ${driverEur} EUR`,
    ...(hasAssistant ? [`${IC.worker} سعر المعاون: ${assistantEur} EUR`] : []),
  ];
  return blocks.join("\n");
}

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [order, setOrder] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [updatingDriver, setUpdatingDriver] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetch(`/api/admin/orders/${p.id}`)
        .then((r) => r.json())
        .then((data) => {
          setOrder(data);
        })
        .catch(() => setOrder(null))
        .finally(() => setLoading(false));
    });
  }, [params]);

  useEffect(() => {
    fetch("/api/admin/drivers")
      .then((r) => r.json())
      .then((list: { id: string; full_name: string; driver_number: number | null; source: string }[]) => {
        const fromApps = (list ?? []).filter((d) => d.source === "application" && d.driver_number != null);
        setDrivers(fromApps.map((d) => ({ id: d.id, full_name: d.full_name, driver_number: d.driver_number, source: d.source })));
      })
      .catch(() => setDrivers([]));
  }, []);

  const assignDriver = (driverApplicationId: string | null) => {
    if (!order) return;
    setUpdatingDriver(true);
    fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, assigned_driver_application_id: driverApplicationId || null }),
    })
      .then((r) => r.json())
      .then((data) => {
        setOrder((prev) => (prev ? { ...prev, assigned_driver_application_id: data.assigned_driver_application_id ?? driverApplicationId } : null));
      })
      .catch(() => {})
      .finally(() => setUpdatingDriver(false));
  };

  const sendEmailToCustomer = () => {
    if (!order?.customer_email) return;
    setSending(true);
    fetch("/api/admin/send-order-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: order.id }),
    })
      .then((r) => {
        if (r.ok) alert("تم إرسال البريد إلى " + order.customer_email);
        else
          r.json().then((d) => {
            const errMsg =
              typeof d?.error === "string"
                ? d.error
                : (d?.error && typeof d.error === "object" && "message" in d.error)
                  ? String((d.error as { message: unknown }).message)
                  : "فشل الإرسال.";
            alert(errMsg);
          });
      })
      .catch(() => alert("فشل الطلب"))
      .finally(() => setSending(false));
  };

  const openWhatsApp = () => {
    if (!order) return;
    const text = buildWhatsAppMessage(order);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const openWhatsAppCustomer = () => {
    if (!order?.phone) return;
    const digits = order.phone.replace(/\D/g, "");
    if (!digits) return;
    window.open(`https://wa.me/${digits}`, "_blank", "noopener");
  };

  const openEmailClient = () => {
    if (!order?.customer_email) return;
    window.location.href = `mailto:${order.customer_email}`;
  };

  const downloadInvoice = (type: "customer" | "driver") => {
    if (!order) return;
    window.open(`/api/admin/invoice?job_id=${encodeURIComponent(order.id)}&type=${type}`, "_blank");
  };

  if (loading || !id) {
    return (
      <div className="rounded-2xl bg-white p-10 shadow-lg">
        <p className="text-[#0d2137]/70">جاري التحميل…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">الطلب غير موجود.</p>
        <Link href="/admin/orders" className="text-[var(--accent)] hover:underline">
          ← العودة للطلبات
        </Link>
      </div>
    );
  }

  const driverPriceEur = getDriverPriceEur(order);
  const customerPriceEur = (order.price_cents / 100).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#0d2137]">تفاصيل الطلب / Order details</h1>
        <Link
          href="/admin/orders"
          className="rounded-xl border-2 border-[#0d2137]/20 bg-white px-4 py-2 text-sm font-medium text-[#0d2137] hover:bg-[#0d2137]/5"
        >
          ← العودة للطلبات
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">معلومات الطلب</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[#0d2137]/60">رقم الطلب</dt>
              <dd className="font-mono font-semibold text-[#0d2137]">{order.order_number ?? order.id}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">التاريخ (إنشاء الطلب)</dt>
              <dd>{new Date(order.created_at).toLocaleDateString("de-DE")}</dd>
            </div>
            {order.preferred_pickup_at && (
              <div>
                <dt className="text-[#0d2137]/60">وقت الاستلام المختار (للحضور)</dt>
                <dd className="font-medium text-[#0d2137]">{new Date(order.preferred_pickup_at).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}</dd>
              </div>
            )}
            <div>
              <dt className="text-[#0d2137]/60">الشركة</dt>
              <dd>{order.company_name}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">الهاتف / واتساب</dt>
              <dd>{order.phone}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">البريد (الزبون)</dt>
              <dd>{order.customer_email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">الاستلام</dt>
              <dd>{order.pickup_address}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">التسليم</dt>
              <dd>{order.delivery_address}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">الحمولة</dt>
              <dd>{order.cargo_size}</dd>
            </div>
            {(order.cargo_details && (typeof (order.cargo_details as { weightKg?: number }).weightKg === "number" || typeof (order.cargo_details as { cargoWeightKg?: number }).cargoWeightKg === "number")) && (
              <div>
                <dt className="text-[#0d2137]/60">الوزن</dt>
                <dd>{(order.cargo_details as { weightKg?: number; cargoWeightKg?: number }).weightKg ?? (order.cargo_details as { cargoWeightKg?: number }).cargoWeightKg} kg</dd>
              </div>
            )}
            <div>
              <dt className="text-[#0d2137]/60">المسافة</dt>
              <dd>{order.distance_km != null ? `${order.distance_km} km` : "—"}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">سعر العميل (النظام)</dt>
              <dd className="font-semibold text-[#0d2137]">€ {customerPriceEur}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">سعر السائق للمجموعة</dt>
              <dd className="font-semibold text-amber-700">€ {driverPriceEur}</dd>
            </div>
            <div>
              <dt className="mb-1.5 text-[#0d2137]/60">رقم السائق / السائق</dt>
              <dd>
                <select
                  value={order.assigned_driver_application_id ?? ""}
                  onChange={(e) => assignDriver(e.target.value || null)}
                  disabled={updatingDriver}
                  className="w-full max-w-xs rounded-lg border-2 border-[#0d2137]/20 bg-white px-3 py-2 text-sm font-medium text-[#0d2137] focus:border-[var(--accent)] focus:outline-none disabled:opacity-60"
                >
                  <option value="">— لا سائق —</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.driver_number != null ? `#${String(d.driver_number)} – ${d.full_name}` : d.full_name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[#0d2137]/50">اختر السائق قبل إرسال بريد التأكيد للعميل ليظهر في الإيميل.</p>
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">إرسال وفتورات</h2>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={openWhatsApp}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 font-medium text-white shadow-sm hover:bg-[#20bd5a]"
            >
              واتساب للمجموعة (سعر السائق فقط)
            </button>
            <button
              type="button"
              onClick={openWhatsAppCustomer}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#25D366] bg-[#25D366]/10 px-4 py-3 font-medium text-[#25D366] hover:bg-[#25D366]/20"
            >
              واتساب العميل ({order.phone})
            </button>
            {order.customer_email && (
              <>
                <button
                  type="button"
                  onClick={openEmailClient}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#0d2137]/20 bg-white px-4 py-3 font-medium text-[#0d2137] hover:bg-[#0d2137]/5"
                >
                  فتح البريد للعميل: {order.customer_email}
                </button>
                <button
                  type="button"
                  onClick={sendEmailToCustomer}
                  disabled={sending}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {sending ? "جاري الإرسال…" : "إرسال بريد التأكيد للعميل"}
                </button>
              </>
            )}
            <hr className="border-[#0d2137]/10" />
            <p className="text-sm font-medium text-[#0d2137]">تحميل الفواتير</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadInvoice("customer")}
                className="rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-800 hover:bg-blue-100"
              >
                فاتورة النظامية (السعر الحقيقي € {customerPriceEur})
              </button>
              <button
                type="button"
                onClick={() => downloadInvoice("driver")}
                className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
              >
                فاتورة المجموعة / السائق (€ {driverPriceEur})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
