"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

type DriverApp = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  status: string;
  driver_number: number | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_notes: string | null;
  rejection_image_urls: string[] | null;
  suspended_at: string | null;
  desired_note: string | null;
  star_rating: number | null;
  stats?: { jobs_count: number; total_paid_cents: number; customer_rating_avg: number | null };
  last_jobs?: Array<{
    id: string;
    order_number: number | null;
    created_at: string;
    logistics_status: string;
    pickup_address: string;
    delivery_address: string;
    company_name: string;
    driver_price_cents: number | null;
    customer_driver_rating: number | null;
  }>;
  service_policy_accepted: boolean;
  id_document_url: string | null;
  license_front_url: string | null;
  license_back_url: string | null;
  tax_or_commercial_number: string | null;
  personal_photo_url: string | null;
  languages_spoken: string | null;
  vehicle_plate: string | null;
  vehicle_documents_url: string | null;
  vehicle_photo_url: string | null;
  work_policy_accepted: boolean;
  created_at: string;
};

const UPLOAD_URL = "/api/driver-applications/upload";

export default function AdminDriverApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const [app, setApp] = useState<DriverApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectFiles, setRejectFiles] = useState<File[]>([]);
  const [desiredNoteEdit, setDesiredNoteEdit] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchApp = () => {
    if (!id) return;
    fetch(`/api/admin/driver-applications/${id}`)
      .then((r) => r.json())
      .then((data) => setApp(data))
      .catch(() => setApp(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchApp();
  }, [id]);

  const openWhatsApp = (text?: string) => {
    if (!app) return;
    const num = app.phone.replace(/\D/g, "");
    const msg = text
      ? encodeURIComponent(text)
      : "";
    window.open(`https://wa.me/${num}${msg ? `?text=${msg}` : ""}`, "_blank");
  };

  const handleApprove = () => {
    if (!id || !window.confirm("تأكيد الموافقة على طلب السائق؟")) return;
    setActionLoading(true);
    fetch(`/api/admin/driver-applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          alert(data?.error || "فشل");
          return;
        }
        fetchApp();
      })
      .catch(() => alert("فشل الاتصال"))
      .finally(() => setActionLoading(false));
  };

  const handleRejectSubmit = async () => {
    const notes = rejectNotes.trim();
    if (!notes) {
      alert("يجب إدخال سبب الرفض (ملاحظات).");
      return;
    }
    setActionLoading(true);
    const urls: string[] = [];
    for (const file of rejectFiles) {
      try {
        const dataUrl = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        const res = await fetch(UPLOAD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: dataUrl, filename: file.name }),
        });
        const json = await res.json();
        if (res.ok && json.url) urls.push(json.url);
      } catch {
        // skip failed upload
      }
    }
    try {
      const res = await fetch(`/api/admin/driver-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejection_notes: notes,
          rejection_image_urls: urls,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRejectModal(false);
        setRejectNotes("");
        setRejectFiles([]);
        fetchApp();
      } else {
        alert(data?.error || "فشل الرفض");
      }
    } catch {
      alert("فشل الاتصال");
    } finally {
      setActionLoading(false);
    }
  };

  const addRejectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setRejectFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeRejectFile = (i: number) => {
    setRejectFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const statusLabel =
    app?.status === "new"
      ? "جديد"
      : app?.status === "approved"
        ? "موافق عليه"
        : app?.status === "rejected"
          ? "مرفوض"
          : app?.status || "";

  if (!id || loading) return <p className="text-[#0d2137]/70">جاري التحميل…</p>;
  if (!app) return <p className="text-[#0d2137]/70">الطلب غير موجود.</p>;

  const welcomeMessage =
    "مرحباً، تمت الموافقة على طلبك في TransPool24. أنت الآن في انتظار أول مهمة لقبول العمل. انضم لمجموعة السائقين لاستلام الطلبات.";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/driver-applications"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← طلبات السائقين
        </Link>
      </div>

      <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#0d2137]">طلب سائق: {app.full_name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#0d2137]/60">
          {new Date(app.created_at).toLocaleString("ar-DE")} · الحالة: {statusLabel}
          {app.driver_number != null && (
            <span className="rounded bg-[var(--accent)]/15 px-2 py-0.5 font-medium text-[var(--accent)]">
              رقم السائق #{String(app.driver_number).padStart(5, "0")}
            </span>
          )}
          {app.suspended_at && (
            <span className="rounded bg-red-100 px-2 py-0.5 font-medium text-red-700">عمله مقيد حتى إشعار آخر</span>
          )}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <p><strong>البريد:</strong> {app.email}</p>
          <p><strong>الهاتف / واتساب:</strong> {app.phone}</p>
          <p><strong>المدينة:</strong> {app.city}</p>
          <p><strong>الرقم الضريبي/التجاري:</strong> {app.tax_or_commercial_number || "—"}</p>
          <p><strong>اللغات:</strong> {app.languages_spoken || "—"}</p>
          <p><strong>رقم السيارة:</strong> {app.vehicle_plate || "—"}</p>
        </div>

        {app.status === "approved" && app.stats && (
          <div className="mt-6 rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.03] p-4">
            <p className="mb-2 text-sm font-semibold text-[#0d2137]/80">إحصائيات الخدمة</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span><strong>عدد الخدمات:</strong> {app.stats.jobs_count}</span>
              <span><strong>إجمالي المبالغ المدفوعة له:</strong> {(app.stats.total_paid_cents / 100).toFixed(2)} €</span>
              <span className="flex items-center gap-1">
                <strong>تقييم العملاء (نجوم):</strong>
                {(app.stats.customer_rating_avg ?? app.star_rating) != null ? (
                  <span className="text-amber-500">
                    {"★".repeat(Math.round(app.stats.customer_rating_avg ?? app.star_rating ?? 0))}
                    {"☆".repeat(5 - Math.round(app.stats.customer_rating_avg ?? app.star_rating ?? 0))}
                    {" "}({(app.stats.customer_rating_avg ?? app.star_rating)?.toFixed(1)})
                  </span>
                ) : (
                  "—"
                )}
              </span>
              <span className="flex items-center gap-1">
                <strong>تقييم يدوي:</strong>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={async () => {
                      const res = await fetch(`/api/admin/driver-applications/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "update_star_rating", star_rating: app.star_rating === n ? null : n }),
                      });
                      if (res.ok) fetchApp();
                    }}
                    className={`text-lg ${(app.star_rating ?? 0) >= n ? "text-amber-500" : "text-[#0d2137]/30"}`}
                  >
                    ★
                  </button>
                ))}
              </span>
            </div>
          </div>
        )}

        {app.status === "approved" && (
          <div className="mt-4">
            <p className="mb-1 text-sm font-semibold text-[#0d2137]/80">المبالغ التي يريدها من الشركة</p>
            {desiredNoteEdit !== "" ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={desiredNoteEdit}
                  onChange={(e) => setDesiredNoteEdit(e.target.value)}
                  className="flex-1 rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                  placeholder="مثال: الراتب أو المبلغ المطلوب..."
                />
                <button
                  type="button"
                  disabled={savingNote}
                  onClick={async () => {
                    setSavingNote(true);
                    try {
                      const res = await fetch(`/api/admin/driver-applications/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "update_desired_note", desired_note: desiredNoteEdit }),
                      });
                      if (res.ok) {
                        setApp((prev) => (prev ? { ...prev, desired_note: desiredNoteEdit } : null));
                        setDesiredNoteEdit("");
                      }
                    } finally {
                      setSavingNote(false);
                    }
                  }}
                  className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm text-white"
                >
                  حفظ
                </button>
                <button type="button" onClick={() => setDesiredNoteEdit("")} className="rounded-lg border px-3 py-2 text-sm">
                  إلغاء
                </button>
              </div>
            ) : (
              <p className="text-sm text-[#0d2137]/70">
                {app.desired_note || "—"}
                <button
                  type="button"
                  onClick={() => setDesiredNoteEdit(app.desired_note ?? "")}
                  className="mr-2 text-[var(--accent)] hover:underline"
                >
                  تعديل
                </button>
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openWhatsApp()}
            className="rounded-lg bg-[#25D366]/10 px-4 py-2 text-sm font-medium text-[#25D366] hover:bg-[#25D366]/20"
          >
            واتساب للتواصل
          </button>

          {app.status === "new" && (
            <>
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                موافقة
              </button>
              <button
                type="button"
                onClick={() => setRejectModal(true)}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                عدم موافقة (رفض)
              </button>
            </>
          )}

          {app.status === "approved" && (
            <>
              {app.driver_number == null && (
                <button
                  type="button"
                  onClick={async () => {
                    setActionLoading(true);
                    try {
                      const res = await fetch(`/api/admin/driver-applications/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "assign_number" }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        fetchApp();
                      } else {
                        alert(data?.error || "فشل");
                      }
                    } catch {
                      alert("فشل الاتصال");
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  تعيين رقم السائق
                </button>
              )}
              <a
                href={`/api/admin/driver-applications/${id}/approval-pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                تحميل PDF الموافقة
              </a>
              <button
                type="button"
                onClick={() => openWhatsApp(welcomeMessage)}
                className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:bg-[#25D366]/90"
              >
                إرسال ترحيب + انضمام للمجموعة (واتساب)
              </button>
              {app.suspended_at ? (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={async () => {
                    if (!window.confirm("إلغاء تقييد عمل هذا السائق؟")) return;
                    setActionLoading(true);
                    try {
                      const res = await fetch(`/api/admin/driver-applications/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "unsuspend" }),
                      });
                      if (res.ok) fetchApp();
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  إلغاء التقيد
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={async () => {
                    if (!window.confirm("تقيد عمل هذا السائق حتى إشعار آخر؟")) return;
                    setActionLoading(true);
                    try {
                      const res = await fetch(`/api/admin/driver-applications/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "suspend" }),
                      });
                      if (res.ok) fetchApp();
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
                >
                  تقيد عمله حتى إشعار آخر
                </button>
              )}
            </>
          )}

          {app.status === "rejected" && app.rejection_notes && (
            <div className="mt-4 w-full rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">سبب الرفض:</p>
              <p className="mt-1 text-sm text-amber-800 whitespace-pre-wrap">{app.rejection_notes}</p>
              {app.rejection_image_urls && app.rejection_image_urls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {app.rejection_image_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={url} alt="" className="h-24 w-24 rounded border object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">المستندات والصور</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {app.id_document_url && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">الهوية/الإقامة</p>
              <a href={app.id_document_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                <img src={app.id_document_url} alt="" className="h-32 w-full object-cover" />
              </a>
            </div>
          )}
          {app.license_front_url && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">رخصة قيادة – أمام</p>
              <a href={app.license_front_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                <img src={app.license_front_url} alt="" className="h-32 w-full object-cover" />
              </a>
            </div>
          )}
          {app.license_back_url && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">رخصة قيادة – خلف</p>
              <a href={app.license_back_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                <img src={app.license_back_url} alt="" className="h-32 w-full object-cover" />
              </a>
            </div>
          )}
          {app.personal_photo_url && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">صورة شخصية</p>
              <a href={app.personal_photo_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                <img src={app.personal_photo_url} alt="" className="h-32 w-full object-cover" />
              </a>
            </div>
          )}
          {app.vehicle_documents_url && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">أوراق السيارة</p>
              <a href={app.vehicle_documents_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                {app.vehicle_documents_url.toLowerCase().endsWith(".pdf") ? (
                  <span className="flex h-32 items-center justify-center bg-[#0d2137]/5 text-sm">PDF</span>
                ) : (
                  <img src={app.vehicle_documents_url} alt="" className="h-32 w-full object-cover" />
                )}
              </a>
            </div>
          )}
          {app.vehicle_photo_url && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">صورة السيارة</p>
              <a href={app.vehicle_photo_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                <img src={app.vehicle_photo_url} alt="" className="h-32 w-full object-cover" />
              </a>
            </div>
          )}
        </div>
      </div>

      {app.last_jobs && app.last_jobs.length > 0 && (
        <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">آخر التنفيذات / الطلبات المنفذة</h2>
          <div className="space-y-3">
            {app.last_jobs.map((job) => (
              <Link
                key={job.id}
                href={`/admin/orders/${job.id}`}
                className="block rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.02] p-4 transition hover:bg-[#0d2137]/[0.05]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-[#0d2137]">
                    طلب #{job.order_number ?? job.id.slice(0, 8)}
                  </span>
                  <span className="text-sm text-[#0d2137]/70">
                    {new Date(job.created_at).toLocaleString("ar-DE")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#0d2137]/80">
                  {job.company_name} · من {String(job.pickup_address).slice(0, 40)}… → إلى {String(job.delivery_address).slice(0, 40)}…
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-[#0d2137]/10 px-2 py-0.5">
                    {job.logistics_status === "delivered" ? "تم التسليم" : job.logistics_status === "in_transit" ? "قيد النقل" : job.logistics_status === "assigned" ? "معيّن" : job.logistics_status}
                  </span>
                  {job.driver_price_cents != null && (
                    <span className="text-[var(--accent)]">{(job.driver_price_cents / 100).toFixed(2)} €</span>
                  )}
                  {job.customer_driver_rating != null && (
                    <span className="text-amber-600">★ {job.customer_driver_rating}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {app.last_jobs && app.last_jobs.length === 0 && app.status === "approved" && (
        <div className="rounded-xl border border-[#0d2137]/10 bg-[#0d2137]/[0.02] p-6">
          <p className="text-sm text-[#0d2137]/70">لا توجد طلبات منفذة لهذا السائق بعد. عند تعيينه لطلبات من لوحة الطلبات ستظهر هنا.</p>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#0d2137]">عدم الموافقة (رفض) – إضافة ملاحظات وصور</h3>
            <p className="mt-2 text-sm text-[#0d2137]/70">
              اكتب سبب الرفض حتى يعلم السائق. يمكنك إرفاق صور توضيحية.
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#0d2137]">سبب الرفض (إلزامي)</label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="مثال: المستندات غير مكتملة، الصورة غير واضحة..."
                className="mt-1 w-full rounded-xl border border-[#0d2137]/20 px-4 py-3 text-sm min-h-[100px]"
                rows={4}
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#0d2137]">إرفاق صور (اختياري)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={addRejectImages}
                className="mt-1 text-sm"
              />
              {rejectFiles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {rejectFiles.map((f, i) => (
                    <span key={i} className="flex items-center gap-1 rounded bg-[#0d2137]/10 px-2 py-1 text-xs">
                      {f.name}
                      <button type="button" onClick={() => removeRejectFile(i)} className="text-red-600 hover:underline">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModal(false);
                  setRejectNotes("");
                  setRejectFiles([]);
                }}
                className="rounded-xl border border-[#0d2137]/20 px-4 py-2 text-sm font-medium"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={actionLoading || !rejectNotes.trim()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "جاري الحفظ…" : "تأكيد الرفض"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
