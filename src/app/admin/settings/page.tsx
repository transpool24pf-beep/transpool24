"use client";

import { useEffect, useState } from "react";

type Pricing = {
  price_per_km_cents?: Record<string, number>;
  driver_hourly_rate_cents?: number;
};

const SIZE_LABELS: Record<string, string> = {
  XS: "صغير (XS)",
  M: "متوسط (M)",
  L: "كبير (L)",
};

function formatEur(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function parseEur(value: string): number {
  const n = parseFloat(value.replace(",", "."));
  return Number.isNaN(n) ? 0 : Math.round(n * 100);
}

export default function AdminSettingsPage() {
  const [pricing, setPricing] = useState<Pricing>({
    price_per_km_cents: { XS: 80, M: 120, L: 200 },
    driver_hourly_rate_cents: 2500,
  });
  const [driverRateEur, setDriverRateEur] = useState("25,00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        const cents = data.driver_hourly_rate_cents ?? 2500;
        setPricing({
          price_per_km_cents: data.price_per_km_cents ?? { XS: 80, M: 120, L: 200 },
          driver_hourly_rate_cents: cents,
        });
        setDriverRateEur(formatEur(cents));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toSave = {
      ...pricing,
      driver_hourly_rate_cents: parseEur(driverRateEur) || 2500,
    };
    fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSave),
    })
      .then((r) => {
        if (r.ok) alert("تم الحفظ.");
        else alert("فشل الحفظ.");
      })
      .catch(() => alert("خطأ في الطلب"))
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
    return (
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <p className="text-[#0d2137]/70">جاري التحميل…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-[#0d2137]">
        الإعدادات / Settings
      </h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-[#0d2137]">
            السعر لكل كم حسب حجم الحمولة (المسافة والوزن)
          </h2>
          <p className="mb-4 text-sm text-[#0d2137]/60">
            يعتمد السعر على المسافة وحجم الشحن (XS / M / L). القيمة بالسنت لكل كيلومتر.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(["XS", "M", "L"] as const).map((size) => (
              <div key={size}>
                <label className="mb-2 block text-sm font-medium text-[#0d2137]/80">
                  {SIZE_LABELS[size]}
                </label>
                <input
                  type="number"
                  min={1}
                  value={pricing.price_per_km_cents?.[size] ?? 0}
                  onChange={(e) => setPerKm(size, parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <p className="mt-1 text-xs text-[#0d2137]/50">سنت/كم</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-[#0d2137]">
            أجر السائق بالساعة (يورو)
          </h2>
          <p className="mb-4 text-sm text-[#0d2137]/60">
            يُستخدم عند حساب المدة من المسار (مثلاً مع Google). أدخل المبلغ باليورو (مثال: 25,00).
          </p>
          <div className="max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={driverRateEur}
              onChange={(e) => setDriverRateEur(e.target.value)}
              placeholder="25,00"
              className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2.5 text-lg focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <p className="mt-1 text-xs text-[#0d2137]/50">
              يورو/ساعة (مثال: 25,00 = 25 يورو)
            </p>
          </div>
        </section>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--accent)] px-6 py-2.5 font-medium text-white hover:opacity-95 disabled:opacity-60"
          >
            {saving ? "جاري الحفظ…" : "يحفظ"}
          </button>
        </div>
      </form>
    </div>
  );
}
