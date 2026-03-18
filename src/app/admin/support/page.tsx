"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SupportRequest = {
  id: string;
  driver_number: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
  driver_info: { full_name: string; phone: string; city: string; id: string } | null;
};

export default function AdminSupportPage() {
  const [list, setList] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/support-requests")
      .then((r) => {
        if (!r.ok) throw new Error("Fehler beim Laden");
        return r.json();
      })
      .then(setList)
      .catch(() => setError("Tabelle support_requests fehlt oder Fehler. Führen Sie supabase/support_requests.sql aus."))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return s;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#0d2137]">رسائل الدعم الفني</h1>
        <Link
          href="/de/support"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-[#0d2137] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d2137]/90"
        >
          فتح نموذج الدعم
        </Link>
      </div>

      {loading && <p className="text-[#0d2137]/70">جاري التحميل…</p>}
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          {error}
        </div>
      )}
      {!loading && !error && list.length === 0 && (
        <p className="text-[#0d2137]/70">لا توجد رسائل حتى الآن.</p>
      )}
      {!loading && !error && list.length > 0 && (
        <div className="space-y-4">
          {list.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-[#0d2137]/10 bg-white p-5 shadow-sm"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0d2137]/50">
                {formatDate(req.created_at)}
              </p>
              <div className="mb-4 rounded-lg border border-[#0d2137]/10 bg-[#f8fafc] p-4">
                <h3 className="mb-2 text-sm font-bold text-[#0d2137]">المرسل – معلومات السائق</h3>
                <ul className="space-y-1 text-sm text-[#0d2137]/90">
                  <li><strong>رقم السائق:</strong> #{String(req.driver_number).padStart(5, "0")}</li>
                  <li><strong>الاسم:</strong> {req.name}</li>
                  <li><strong>البريد:</strong> <a href={`mailto:${req.email}`} className="text-[#e85d04] hover:underline">{req.email}</a></li>
                  {req.driver_info?.phone && <li><strong>الهاتف / واتساب:</strong> <a href={`https://wa.me/${req.driver_info.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-[#25D366] hover:underline">{req.driver_info.phone}</a></li>}
                  {req.driver_info?.city && <li><strong>المدينة:</strong> {req.driver_info.city}</li>}
                </ul>
                {req.driver_info?.id && (
                  <Link
                    href={`/admin/driver-applications/${req.driver_info.id}`}
                    className="mt-2 inline-block text-sm font-medium text-[#e85d04] hover:underline"
                  >
                    فتح ملف السائق →
                  </Link>
                )}
              </div>
              <div>
                <h3 className="mb-2 text-sm font-bold text-[#0d2137]">محتوى الرسالة</h3>
                <p className="whitespace-pre-wrap rounded-lg border border-[#0d2137]/10 bg-white p-4 text-[#0d2137]/90">{req.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
