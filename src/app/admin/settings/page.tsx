"use client";

import { useEffect, useState } from "react";

type Pricing = {
  price_per_km_cents?: Record<string, number>;
  driver_hourly_rate_cents?: number;
};

export default function AdminSettingsPage() {
  const [pricing, setPricing] = useState<Pricing>({
    price_per_km_cents: { XS: 80, M: 120, L: 200 },
    driver_hourly_rate_cents: 2500,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setPricing({
          price_per_km_cents: data.price_per_km_cents ?? { XS: 80, M: 120, L: 200 },
          driver_hourly_rate_cents: data.driver_hourly_rate_cents ?? 2500,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pricing),
    })
      .then((r) => {
        if (r.ok) alert("Settings saved.");
        else alert("Failed to save.");
      })
      .catch(() => alert("Request failed"))
      .finally(() => setSaving(false));
  };

  const setPerKm = (size: string, value: number) => {
    setPricing((prev) => ({
      ...prev,
      price_per_km_cents: {
        ...(prev.price_per_km_cents ?? {}),
        [size]: value,
      },
    }));
  };

  if (loading) {
    return <p className="text-[#0d2137]/70">Loading…</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-[#0d2137]">
        Settings / الإعدادات
      </h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-6 rounded-lg border border-[#0d2137]/15 bg-white p-6 shadow-sm">
        <div>
          <h2 className="mb-3 text-lg font-medium text-[#0d2137]">
            Price per km (cents) / السعر لكل كم
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {(["XS", "M", "L"] as const).map((size) => (
              <div key={size}>
                <label className="mb-1 block text-sm text-[#0d2137]/70">
                  {size}
                </label>
                <input
                  type="number"
                  min={1}
                  value={pricing.price_per_km_cents?.[size] ?? 0}
                  onChange={(e) => setPerKm(size, parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2"
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-medium text-[#0d2137]">
            Driver hourly rate (cents) / أجر السائق بالساعة
          </h2>
          <input
            type="number"
            min={0}
            value={pricing.driver_hourly_rate_cents ?? 2500}
            onChange={(e) =>
              setPricing((prev) => ({
                ...prev,
                driver_hourly_rate_cents: parseInt(e.target.value, 10) || 0,
              }))
            }
            className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2"
          />
          <p className="mt-1 text-xs text-[#0d2137]/60">
            € {(pricing.driver_hourly_rate_cents ?? 0) / 100} per hour
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
