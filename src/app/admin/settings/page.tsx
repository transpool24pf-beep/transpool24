"use client";

import { useEffect, useState } from "react";
import { CARGO_CATEGORIES, CARGO_CATEGORY_LABEL_DE } from "@/lib/cargo";
import { PRICING_DEFAULTS } from "@/lib/settings";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";

type Pricing = {
  price_per_km_cents?: Record<string, number>;
  driver_hourly_rate_cents?: number;
  driver_only_hourly_cents?: number;
  assistant_fee_cents?: number;
  weight_surcharge_cents_per_10kg?: number;
  cargo_category_adjustment_cents?: Record<string, number>;
};

const DEFAULT_PRICE_PER_KM_CENTS: Record<"XS" | "M" | "L", number> = {
  XS: 80,
  M: 120,
  L: 200,
};

const SIZE_LABEL_KEYS: Record<"XS" | "M" | "L", string> = {
  XS: "settings.sizeXS",
  M: "settings.sizeM",
  L: "settings.sizeL",
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
  const { t } = useAdminLocale();
  const [pricing, setPricing] = useState<Pricing>({
    price_per_km_cents: { ...DEFAULT_PRICE_PER_KM_CENTS },
    driver_hourly_rate_cents: 2500,
    driver_only_hourly_cents: 4500,
    assistant_fee_cents: 1630,
    weight_surcharge_cents_per_10kg: 50,
    cargo_category_adjustment_cents: { ...PRICING_DEFAULTS.cargo_category_adjustment_cents },
  });
  const [perKmEur, setPerKmEur] = useState<Record<"XS" | "M" | "L", string>>(() => ({
    XS: formatEur(DEFAULT_PRICE_PER_KM_CENTS.XS),
    M: formatEur(DEFAULT_PRICE_PER_KM_CENTS.M),
    L: formatEur(DEFAULT_PRICE_PER_KM_CENTS.L),
  }));
  const [driverRateEur, setDriverRateEur] = useState("25,00");
  const [driverOnlyEur, setDriverOnlyEur] = useState("45,00");
  const [assistantFeeEur, setAssistantFeeEur] = useState("16,30");
  const [weightPer10Eur, setWeightPer10Eur] = useState("0,50");
  const [categoryEur, setCategoryEur] = useState<Record<string, string>>(() =>
    Object.fromEntries(CARGO_CATEGORIES.map((c) => [c.id, "0,00"]))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bookingsPaused, setBookingsPaused] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsToggleLoading, setBookingsToggleLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/bookings")
      .then((r) => r.json())
      .then((d: { paused?: boolean }) => {
        if (typeof d.paused === "boolean") setBookingsPaused(d.paused);
      })
      .catch(() => {})
      .finally(() => setBookingsLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        const withCar = data.driver_hourly_rate_cents ?? 2500;
        const onlyDriver = data.driver_only_hourly_cents ?? 4500;
        const assistant = data.assistant_fee_cents ?? 1630;
        const w10 = data.weight_surcharge_cents_per_10kg ?? 50;
        const cats = {
          ...PRICING_DEFAULTS.cargo_category_adjustment_cents,
          ...(data.cargo_category_adjustment_cents as Record<string, number> | undefined),
        };
        const perKm = data.price_per_km_cents ?? DEFAULT_PRICE_PER_KM_CENTS;
        setPricing({
          price_per_km_cents: perKm,
          driver_hourly_rate_cents: withCar,
          driver_only_hourly_cents: onlyDriver,
          assistant_fee_cents: assistant,
          weight_surcharge_cents_per_10kg: w10,
          cargo_category_adjustment_cents: cats,
        });
        setPerKmEur({
          XS: formatEur(perKm.XS ?? DEFAULT_PRICE_PER_KM_CENTS.XS),
          M: formatEur(perKm.M ?? DEFAULT_PRICE_PER_KM_CENTS.M),
          L: formatEur(perKm.L ?? DEFAULT_PRICE_PER_KM_CENTS.L),
        });
        setDriverRateEur(formatEur(withCar));
        setDriverOnlyEur(formatEur(onlyDriver));
        setAssistantFeeEur(formatEur(assistant));
        setWeightPer10Eur(formatEur(w10));
        setCategoryEur(
          Object.fromEntries(
            CARGO_CATEGORIES.map((c) => [c.id, formatEur(cats[c.id] ?? 0)])
          )
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const categoryAdjust: Record<string, number> = {};
    for (const c of CARGO_CATEGORIES) {
      categoryAdjust[c.id] = Math.max(0, parseEur(categoryEur[c.id] ?? "0"));
    }
    const pricePerKmCents: Record<string, number> = {};
    for (const size of ["XS", "M", "L"] as const) {
      const parsed = parseEur(perKmEur[size] ?? "0");
      pricePerKmCents[size] = Math.max(
        1,
        parsed || DEFAULT_PRICE_PER_KM_CENTS[size]
      );
    }
    const toSave = {
      ...pricing,
      price_per_km_cents: pricePerKmCents,
      driver_hourly_rate_cents: parseEur(driverRateEur) || 2500,
      driver_only_hourly_cents: parseEur(driverOnlyEur) || 4500,
      assistant_fee_cents: parseEur(assistantFeeEur) || 1630,
      weight_surcharge_cents_per_10kg: Math.max(0, parseEur(weightPer10Eur) || 50),
      cargo_category_adjustment_cents: categoryAdjust,
    };
    fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSave),
    })
      .then((r) => {
        if (r.ok) alert(t("common.saved"));
        else alert(t("common.saveFailed"));
      })
      .catch(() => alert(t("common.requestFailed")))
      .finally(() => setSaving(false));
  };

  const toggleBookingsPaused = () => {
    setBookingsToggleLoading(true);
    fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: !bookingsPaused }),
    })
      .then((r) => r.json())
      .then((d: { paused?: boolean }) => {
        if (typeof d.paused === "boolean") setBookingsPaused(d.paused);
        else alert(t("common.saveFailed"));
      })
      .catch(() => alert(t("common.requestFailed")))
      .finally(() => setBookingsToggleLoading(false));
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <p className="text-[#0d2137]/70">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-[#0d2137]">{t("settings.title")}</h1>

      <section className="mb-8 rounded-xl border-2 border-amber-300/80 bg-amber-50/40 p-6 shadow-sm ring-1 ring-amber-200/60">
        <h2 className="mb-1 text-lg font-medium text-[#0d2137]">{t("settings.bookingsTitle")}</h2>
        <p className="mb-4 text-sm text-[#0d2137]/65">{t("settings.bookingsDesc")}</p>
        {bookingsLoading ? (
          <p className="text-sm text-[#0d2137]/55">{t("common.loading")}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={toggleBookingsPaused}
              disabled={bookingsToggleLoading}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${
                bookingsPaused ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {bookingsToggleLoading
                ? "…"
                : bookingsPaused
                  ? t("settings.bookingsActivate")
                  : t("settings.bookingsPause")}
            </button>
            <span
              className={`text-sm font-medium ${bookingsPaused ? "text-amber-800" : "text-emerald-800"}`}
            >
              {t("settings.bookingsStatus")}:{" "}
              {bookingsPaused ? t("settings.bookingsPaused") : t("settings.bookingsActive")}
            </span>
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-[#0d2137]">{t("settings.pricePerKmTitle")}</h2>
          <p className="mb-4 text-sm text-[#0d2137]/60">{t("settings.pricePerKmDesc")}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(["XS", "M", "L"] as const).map((size) => (
              <div key={size}>
                <label className="mb-2 block text-sm font-medium text-[#0d2137]/80">{t(SIZE_LABEL_KEYS[size])}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={perKmEur[size]}
                  onChange={(e) =>
                    setPerKmEur((prev) => ({ ...prev, [size]: e.target.value }))
                  }
                  placeholder="1,20"
                  className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2.5 text-lg focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <p className="mt-1 text-xs text-[#0d2137]/50">{t("settings.perKm")}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-[#0d2137]">{t("settings.driverWithCarTitle")}</h2>
          <p className="mb-4 text-sm text-[#0d2137]/60">{t("settings.driverWithCarDesc")}</p>
          <div className="max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={driverRateEur}
              onChange={(e) => setDriverRateEur(e.target.value)}
              placeholder="25,00"
              className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2.5 text-lg focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <p className="mt-1 text-xs text-[#0d2137]/50">{t("settings.perHour")}</p>
          </div>
        </section>

        <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-[#0d2137]">{t("settings.driverOnlyTitle")}</h2>
          <p className="mb-4 text-sm text-[#0d2137]/60">{t("settings.driverOnlyDesc")}</p>
          <div className="max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={driverOnlyEur}
              onChange={(e) => setDriverOnlyEur(e.target.value)}
              placeholder="45,00"
              className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2.5 text-lg focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <p className="mt-1 text-xs text-[#0d2137]/50">{t("settings.perHour")}</p>
          </div>
        </section>

        <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-[#0d2137]">{t("settings.weightTitle")}</h2>
          <p className="mb-4 text-sm text-[#0d2137]/60">{t("settings.weightDesc")}</p>
          <div className="max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={weightPer10Eur}
              onChange={(e) => setWeightPer10Eur(e.target.value)}
              placeholder="0,50"
              className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2.5 text-lg focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <p className="mt-1 text-xs text-[#0d2137]/50">{t("settings.weightHint")}</p>
          </div>
        </section>

        <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-[#0d2137]">{t("settings.categoryTitle")}</h2>
          <p className="mb-4 text-sm text-[#0d2137]/60">{t("settings.categoryDesc")}</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {CARGO_CATEGORIES.map((c) => (
              <div key={c.id}>
                <label className="mb-2 block text-sm font-medium text-[#0d2137]/80">
                  {CARGO_CATEGORY_LABEL_DE[c.id]}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={categoryEur[c.id] ?? "0,00"}
                  onChange={(e) =>
                    setCategoryEur((prev) => ({ ...prev, [c.id]: e.target.value }))
                  }
                  placeholder="0,00"
                  className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <p className="mt-1 text-xs text-[#0d2137]/50">{t("settings.perOrder")}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-[#0d2137]">{t("settings.assistantTitle")}</h2>
          <p className="mb-4 text-sm text-[#0d2137]/60">{t("settings.assistantDesc")}</p>
          <div className="max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={assistantFeeEur}
              onChange={(e) => setAssistantFeeEur(e.target.value)}
              placeholder="16,30"
              className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2.5 text-lg focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <p className="mt-1 text-xs text-[#0d2137]/50">{t("settings.perHour")}</p>
          </div>
        </section>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--accent)] px-6 py-2.5 font-medium text-white hover:opacity-95 disabled:opacity-60"
          >
            {saving ? t("common.saving") : t("settings.savePrices")}
          </button>
        </div>
      </form>
    </div>
  );
}
