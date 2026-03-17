"use client";

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
                  <p className="font-medium text-[#0d2137]">
                    {d.full_name || d.company_name || "—"}
                  </p>
                  <p className="text-sm text-[#0d2137]/70">{d.email ?? "—"}</p>
                  <p className="text-sm text-[#0d2137]/70">{d.phone ?? "—"}</p>
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
