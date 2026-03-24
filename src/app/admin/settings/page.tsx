"use client";

import { useEffect, useState } from "react";
import { CARGO_CATEGORIES, CARGO_CATEGORY_LABEL_DE } from "@/lib/cargo";
import { PRICING_DEFAULTS } from "@/lib/settings";

type Pricing = {
  price_per_km_cents?: Record<string, number>;
  driver_hourly_rate_cents?: number;
  driver_only_hourly_cents?: number;
  assistant_fee_cents?: number;
  weight_surcharge_cents_per_10kg?: number;
  cargo_category_adjustment_cents?: Record<string, number>;
};

const SIZE_LABELS: Record<string, string> = {
  XS: "Klein (XS)",
  M: "Mittel (M)",
  L: "Groß (L)",
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
    driver_only_hourly_cents: 4500,
    assistant_fee_cents: 1630,
    weight_surcharge_cents_per_10kg: 50,
    cargo_category_adjustment_cents: { ...PRICING_DEFAULTS.cargo_category_adjustment_cents },
  });
  const [driverRateEur, setDriverRateEur] = useState("25,00");
  const [driverOnlyEur, setDriverOnlyEur] = useState("45,00");
  const [assistantFeeEur, setAssistantFeeEur] = useState("16,30");
  const [weightPer10Eur, setWeightPer10Eur] = useState("0,50");
  const [categoryEur, setCategoryEur] = useState<Record<string, string>>(() =>
    Object.fromEntries(CARGO_CATEGORIES.map((c) => [c.id, "0,00"]))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        setPricing({
          price_per_km_cents: data.price_per_km_cents ?? { XS: 80, M: 120, L: 200 },
          driver_hourly_rate_cents: withCar,
          driver_only_hourly_cents: onlyDriver,
          assistant_fee_cents: assistant,
          weight_surcharge_cents_per_10kg: w10,
          cargo_category_adjustment_cents: cats,
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
    const toSave = {
      ...pricing,
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
        if (r.ok) alert("Gespeichert.");
        else alert("Speichern fehlgeschlagen.");
      })
      .catch(() => alert("Anfrage fehlgeschlagen"))
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
        <p className="text-[#0d2137]/70">Laden…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-[#0d2137]">Einstellungen</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-[#0d2137]">Preis pro km nach Ladungsgröße</h2>
          <p className="mb-4 text-sm text-[#0d2137]/60">
            Abhängig von Strecke und Größe (XS / M / L). Werte in Cent pro Kilometer.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(["XS", "M", "L"] as const).map((size) => (
              <div key={size}>
                <label className="mb-2 block text-sm font-medium text-[#0d2137]/80">{SIZE_LABELS[size]}</label>
                <input
                  type="number"
                  min={1}
                  value={pricing.price_per_km_cents?.[size] ?? 0}
                  onChange={(e) => setPerKm(size, parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <p className="mt-1 text-xs text-[#0d2137]/50">Cent/km</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-[#0d2137]">Stundenlohn: Fahrer mit Fahrzeug</h2>
          <p className="mb-4 text-sm text-[#0d2137]/60">
            Für die Zeitberechnung bei „Fahrer mit Auto“ (zusätzlich zum km-Preis). Z. B. 25,00 €/h.
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
            <p className="mt-1 text-xs text-[#0d2137]/50">Euro pro Stunde</p>
          </div>
        </section>

        <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-[#0d2137]">Stundenlohn: Nur Fahrer (ohne Fahrzeug)</h2>
          <p className="mb-4 text-sm text-[#0d2137]/60">
            Gilt für „Nur Fahrer“ – der Preis wird nur nach Fahrzeit berechnet (kein km-Anteil in der Formel).
          </p>
          <div className="max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={driverOnlyEur}
              onChange={(e) => setDriverOnlyEur(e.target.value)}
              placeholder="45,00"
              className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2.5 text-lg focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <p className="mt-1 text-xs text-[#0d2137]/50">Euro pro Stunde</p>
          </div>
        </section>

        <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-[#0d2137]">Gewicht: Aufschlag je 10 kg</h2>
          <p className="mb-4 text-sm text-[#0d2137]/60">
            Wird pro angefangener 10 kg der angegebenen Ladungsmasse berechnet (z. B. 0,50 € = 50 Cent
            pro 10 kg). Gilt sofort für neue Preisberechnungen nach Speichern.
          </p>
          <div className="max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={weightPer10Eur}
              onChange={(e) => setWeightPer10Eur(e.target.value)}
              placeholder="0,50"
              className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2.5 text-lg focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <p className="mt-1 text-xs text-[#0d2137]/50">Euro je 10 kg (Standard 0,50)</p>
          </div>
        </section>

        <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-[#0d2137]">Warenkategorie: Aufschlag pro Auftrag</h2>
          <p className="mb-4 text-sm text-[#0d2137]/60">
            Einmaliger Betrag pro Bestellung je Kategorie („Was transportieren Sie?“). Mit 0,00 € überall
            erhalten alle Kategorien denselben Basispreis; kleine Differenzen sind optional.
          </p>
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
                <p className="mt-1 text-xs text-[#0d2137]/50">Einmalig pro Auftrag (€)</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-[#0d2137]">Helfer: Stundensatz</h2>
          <p className="mb-4 text-sm text-[#0d2137]/60">
            Bei „Fahrer mit Auto + Helfer“: wird mit der gleichen Gesamtfahrerzeit multipliziert wie der
            Fahrzeit-Anteil (Hin- und Rückfahrt + Be- und Entladezeit), z. B. 16,30 €/h.
          </p>
          <div className="max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={assistantFeeEur}
              onChange={(e) => setAssistantFeeEur(e.target.value)}
              placeholder="16,30"
              className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2.5 text-lg focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <p className="mt-1 text-xs text-[#0d2137]/50">Euro pro Stunde</p>
          </div>
        </section>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--accent)] px-6 py-2.5 font-medium text-white hover:opacity-95 disabled:opacity-60"
          >
            {saving ? "Speichern…" : "Speichern"}
          </button>
        </div>
      </form>
    </div>
  );
}
