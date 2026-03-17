"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Doc = { driver_id: string; document_type: string; storage_path: string; file_name: string | null; verified: boolean };
type Driver = {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  star_rating: number | null;
  avatar_url: string | null;
  created_at: string;
  documents: Doc[];
  source?: "profile" | "application";
  driver_number?: number | null;
};

const DOC_LABELS: Record<string, string> = {
  gewerbe: "Gewerbe",
  insurance: "Insurance",
  id: "ID",
};

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStar, setEditingStar] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/drivers")
      .then((r) => r.json())
      .then((data) => setDrivers(Array.isArray(data) ? data : []))
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  }, []);

  const updateStarRating = (id: string, star_rating: number | null) => {
    const driver = drivers.find((d) => d.id === id);
    if (driver?.source === "application") return;
    setEditingStar(id);
    fetch("/api/admin/drivers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, star_rating }),
    })
      .then((r) => {
        if (r.ok) {
          setDrivers((prev) =>
            prev.map((d) => (d.id === id ? { ...d, star_rating } : d))
          );
        }
      })
      .finally(() => setEditingStar(null));
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-[#0d2137]">السائقين / Drivers</h1>
      <div className="mb-6 rounded-xl border border-[var(--accent)]/30 bg-[#fff8f0] p-4">
        <p className="text-sm text-[#0d2137]/90">
          <strong>ملاحظة:</strong> طلبات التقديم من نموذج السائقين (الاسم، البريد، المستندات، إلخ) تظهر في قسم{" "}
          <Link href="/admin/driver-applications" className="font-semibold text-[var(--accent)] underline hover:no-underline">
            طلبات السائقين
          </Link>
          {" "}في القائمة — وليس هنا. هذا القسم يعرض السائقين المسجلين في النظام بعد الموافقة.
        </p>
      </div>
      {loading ? (
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <p className="text-[#0d2137]/70">جاري التحميل…</p>
        </div>
      ) : (
        <div className="space-y-4">
          {drivers.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-[#0d2137]/10 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start gap-4">
                {d.avatar_url ? (
                  <img
                    src={d.avatar_url}
                    alt=""
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0d2137]/10 text-2xl text-[#0d2137]/50">
                    —
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-[#0d2137]">
                      {d.full_name || d.company_name || "—"}
                    </p>
                    {d.driver_number != null && (
                      <span className="rounded bg-[var(--accent)]/15 px-2 py-0.5 text-sm font-medium text-[var(--accent)]">
                        رقم السائق #{d.driver_number}
                      </span>
                    )}
                    {d.source === "application" && (
                      <Link
                        href={`/admin/driver-applications/${d.id}`}
                        className="text-xs text-[var(--accent)] hover:underline"
                      >
                        عرض الطلب
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-[#0d2137]/70">{d.email ?? "—"}</p>
                  <p className="text-sm text-[#0d2137]/70">{d.phone ?? "—"}</p>
                  {d.source !== "application" && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-[#0d2137]/70">Stars / نجمة:</span>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() =>
                            updateStarRating(d.id, d.star_rating === n ? null : n)
                          }
                          disabled={editingStar === d.id}
                          className={`text-lg ${(d.star_rating ?? 0) >= n ? "text-amber-500" : "text-[#0d2137]/30"}`}
                        >
                          ★
                        </button>
                      ))}
                      {editingStar === d.id && <span className="text-xs">…</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t border-[#0d2137]/10 pt-4">
                <p className="mb-2 text-sm font-medium text-[#0d2137]/80">
                  الأوراق / Documents
                </p>
                {d.documents.length === 0 ? (
                  <p className="text-sm text-[#0d2137]/60">No documents</p>
                ) : (
                  <ul className="space-y-1 text-sm text-[#0d2137]/80">
                    {d.documents.map((doc, i) => (
                      <li key={i}>
                        {DOC_LABELS[doc.document_type] ?? doc.document_type}:{" "}
                        {doc.file_name ?? doc.storage_path}{" "}
                        {doc.verified && (
                          <span className="text-green-600">✓ verified</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && drivers.length === 0 && (
        <p className="text-[#0d2137]/70">No drivers registered yet.</p>
      )}
    </div>
  );
}
