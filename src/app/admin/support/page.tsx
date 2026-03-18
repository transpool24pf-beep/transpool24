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
              <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-[#0d2137]/10 pb-3">
                <span className="rounded bg-[#0d2137] px-2 py-0.5 text-sm font-medium text-white">
                  #{String(req.driver_number).padStart(5, "0")}
                </span>
                <span className="font-medium text-[#0d2137]">{req.name}</span>
                <a
                  href={`mailto:${req.email}`}
                  className="text-sm text-[#0d2137]/70 hover:underline"
                >
                  {req.email}
                </a>
                <span className="text-sm text-[#0d2137]/50">
                  {formatDate(req.created_at)}
                </span>
                <Link
                  href="/admin/drivers"
                  className="text-sm text-[#e85d04] hover:underline"
                >
                  السائقين
                </Link>
              </div>
              <p className="whitespace-pre-wrap text-[#0d2137]/90">{req.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
