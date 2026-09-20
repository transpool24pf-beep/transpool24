"use client";

import { useMemo, useState } from "react";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";
import { addGermanVat19, formatPrice } from "@/lib/pricing";

export function AdminManualInvoiceForm() {
  const { t } = useAdminLocale();
  const [invName, setInvName] = useState("");
  const [invPhone, setInvPhone] = useState("");
  const [invStreet, setInvStreet] = useState("");
  const [invHouse, setInvHouse] = useState("");
  const [invPlz, setInvPlz] = useState("");
  const [invCity, setInvCity] = useState("");
  const [invCountry, setInvCountry] = useState("Deutschland");
  const [invCustomerNo, setInvCustomerNo] = useState("");
  const [invNet, setInvNet] = useState("");
  const [invServiceDate, setInvServiceDate] = useState("");
  const [invPickup, setInvPickup] = useState("");
  const [invDelivery, setInvDelivery] = useState("");
  const [invBusy, setInvBusy] = useState(false);
  const [invError, setInvError] = useState<string | null>(null);

  const invVat = useMemo(() => {
    const n = Number(invNet.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return null;
    return addGermanVat19(Math.round(n * 100));
  }, [invNet]);

  return (
    <form
      className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setInvError(null);
        if (!invName.trim()) {
          setInvError(t("reports.extractNeedName"));
          return;
        }
        if (!invVat) {
          setInvError(t("reports.extractNeedPrice"));
          return;
        }
        setInvBusy(true);
        try {
          const res = await fetch("/api/admin/manual-invoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerName: invName,
              phone: invPhone,
              street: invStreet,
              houseNumber: invHouse,
              postalCode: invPlz,
              city: invCity,
              country: invCountry || "Deutschland",
              customerNumber: invCustomerNo,
              netEur: invNet,
              serviceDate: invServiceDate || null,
              pickupAt: invPickup || null,
              deliveryAt: invDelivery || null,
            }),
          });
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(j.error || t("common.requestFailed"));
          }
          const blob = await res.blob();
          const cd = res.headers.get("Content-Disposition") || "";
          const m = cd.match(/filename="([^"]+)"/);
          const filename = m?.[1] || "TransPool24-Rechnung.pdf";
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        } catch (err) {
          setInvError(err instanceof Error ? err.message : t("common.requestFailed"));
        } finally {
          setInvBusy(false);
        }
      }}
    >
      <label className="block text-sm sm:col-span-2">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.customerName")}</span>
        <input
          required
          value={invName}
          onChange={(e) => setInvName(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("common.phone")}</span>
        <input
          value={invPhone}
          onChange={(e) => setInvPhone(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.street")}</span>
        <input
          value={invStreet}
          onChange={(e) => setInvStreet(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.houseNumber")}</span>
        <input
          value={invHouse}
          onChange={(e) => setInvHouse(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.postalCode")}</span>
        <input
          value={invPlz}
          onChange={(e) => setInvPlz(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.city")}</span>
        <input
          value={invCity}
          onChange={(e) => setInvCity(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("common.country")}</span>
        <input
          value={invCountry}
          onChange={(e) => setInvCountry(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.customerNo")}</span>
        <input
          value={invCustomerNo}
          onChange={(e) => setInvCustomerNo(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.netPrice")}</span>
        <input
          required
          inputMode="decimal"
          value={invNet}
          onChange={(e) => setInvNet(e.target.value)}
          placeholder="423,04"
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.serviceDate")}</span>
        <input
          type="date"
          value={invServiceDate}
          onChange={(e) => setInvServiceDate(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.colPickupTime")}</span>
        <input
          type="datetime-local"
          value={invPickup}
          onChange={(e) => setInvPickup(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.colDeliveryTime")}</span>
        <input
          type="datetime-local"
          value={invDelivery}
          onChange={(e) => setInvDelivery(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <div
        dir="ltr"
        lang="de"
        className="rounded-xl border border-[#0d2137]/10 bg-[#0d2137]/5 px-4 py-3 text-sm sm:col-span-2 lg:col-span-3"
      >
        <p className="flex justify-between text-[#0d2137]/75">
          <span>Netto</span>
          <span>{invVat ? formatPrice(invVat.netCents) : "—"}</span>
        </p>
        <p className="flex justify-between text-[#0d2137]/75">
          <span>zzgl. 19 % MwSt.</span>
          <span>{invVat ? formatPrice(invVat.vatCents) : "—"}</span>
        </p>
        <p className="mt-1 flex justify-between font-semibold text-[#0d2137]">
          <span>Gesamtbetrag</span>
          <span>{invVat ? formatPrice(invVat.grossCents) : "—"}</span>
        </p>
      </div>
      {invError ? (
        <p className="text-sm text-red-700 sm:col-span-2 lg:col-span-3">{invError}</p>
      ) : null}
      <div className="sm:col-span-2 lg:col-span-3">
        <button
          type="submit"
          disabled={invBusy}
          className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {invBusy ? t("common.loading") : t("reports.extractInvoiceDownload")}
        </button>
      </div>
    </form>
  );
}
