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
          setApiError(data?.error || "خطأ في التحميل");
          return [];
        }
        return Array.isArray(data) ? data : [];
      })
      .then(setList)
      .catch(() => {
        setApiError("فشل الاتصال. تحقق من تشغيل الموقع وقاعدة البيانات.");
        setList([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-[#0d2137]">طلبات السائقين</h1>
      {apiError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {apiError} — تأكد من تنفيذ ملف الهجرة <code className="bg-amber-100 px-1">add_driver_applications.sql</code> و <code className="bg-amber-100 px-1">add_driver_application_fields.sql</code> في Supabase.
        </div>
      )}
      {loading ? (
        <p className="text-[#0d2137]/70">جاري التحميل…</p>
      ) : list.length === 0 ? (
        <p className="text-[#0d2137]/70">لا توجد طلبات حتى الآن. الطلبات المقدمة من صفحة السائقين ستظهر هنا بعد الإرسال.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#0d2137]/10 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-right">
            <thead>
              <tr className="border-b border-[#0d2137]/10 bg-[#0d2137]/5">
                <th className="p-3 text-sm font-semibold text-[#0d2137]">الاسم</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]">البريد</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]">الهاتف</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]">المدينة</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]">الحالة</th>
                <th className="p-3 text-sm font-semibold text-[#0d2137]">التاريخ</th>
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
                  <td className="p-3 text-sm text-[#0d2137]/80">{app.status === "new" ? "جديد" : app.status}</td>
                  <td className="p-3 text-sm text-[#0d2137]/70">
                    {new Date(app.created_at).toLocaleDateString("ar-DE")}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/driver-applications/${app.id}`}
                      className="rounded-lg bg-[var(--accent)]/10 px-3 py-1.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20"
                    >
                      عرض
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
