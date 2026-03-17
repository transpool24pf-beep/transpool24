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

export default function AdminDriverApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const [app, setApp] = useState<DriverApp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/driver-applications/${id}`)
      .then((r) => r.json())
      .then((data) => setApp(data))
      .catch(() => setApp(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id || loading) return <p className="text-[#0d2137]/70">جاري التحميل…</p>;
  if (!app) return <p className="text-[#0d2137]/70">الطلب غير موجود.</p>;

  const openWhatsApp = () => {
    const num = app.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${num}`, "_blank");
  };

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
        <p className="mt-1 text-sm text-[#0d2137]/60">
          {new Date(app.created_at).toLocaleString("ar-DE")} · الحالة: {app.status === "new" ? "جديد" : app.status}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <p><strong>البريد:</strong> {app.email}</p>
          <p><strong>الهاتف / واتساب:</strong> {app.phone}</p>
          <p><strong>المدينة:</strong> {app.city}</p>
          <p><strong>الرقم الضريبي/التجاري:</strong> {app.tax_or_commercial_number || "—"}</p>
          <p><strong>اللغات:</strong> {app.languages_spoken || "—"}</p>
          <p><strong>رقم السيارة:</strong> {app.vehicle_plate || "—"}</p>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={openWhatsApp}
            className="rounded-lg bg-[#25D366]/10 px-4 py-2 text-sm font-medium text-[#25D366] hover:bg-[#25D366]/20"
          >
            واتساب للتواصل
          </button>
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
    </div>
  );
}
