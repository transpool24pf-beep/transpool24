"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";
import {
  loadExtractInvoiceDraft,
  saveExtractInvoiceDraft,
} from "@/lib/admin-extract-invoice-draft";
import { addGermanVat19, formatPrice } from "@/lib/pricing";

export function AdminManualInvoiceForm() {
  const { t } = useAdminLocale();
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");
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
  const [delStreet, setDelStreet] = useState("");
  const [delHouse, setDelHouse] = useState("");
  const [delPlz, setDelPlz] = useState("");
  const [delCity, setDelCity] = useState("");
  const [delCountry, setDelCountry] = useState("Deutschland");
  const [invBusy, setInvBusy] = useState(false);
  const [invError, setInvError] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    const d = loadExtractInvoiceDraft();
    setInvName(d.name);
    setInvEmail(d.email);
    setInvPhone(d.phone);
    setInvStreet(d.street);
    setInvHouse(d.house);
    setInvPlz(d.plz);
    setInvCity(d.city);
    setInvCountry(d.country || "Deutschland");
    setInvCustomerNo(d.customerNo);
    setInvNet(d.net);
    setInvServiceDate(d.serviceDate);
    setInvPickup(d.pickup);
    setInvDelivery(d.delivery);
    setDelStreet(d.delStreet);
    setDelHouse(d.delHouse);
    setDelPlz(d.delPlz);
    setDelCity(d.delCity);
    setDelCountry(d.delCountry || "Deutschland");
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    saveExtractInvoiceDraft({
      name: invName,
      email: invEmail,
      phone: invPhone,
      street: invStreet,
      house: invHouse,
      plz: invPlz,
      city: invCity,
      country: invCountry,
      customerNo: invCustomerNo,
      net: invNet,
      serviceDate: invServiceDate,
      pickup: invPickup,
      delivery: invDelivery,
      delStreet,
      delHouse,
      delPlz,
      delCity,
      delCountry,
    });
  }, [
    draftReady,
    invName,
    invEmail,
    invPhone,
    invStreet,
    invHouse,
    invPlz,
    invCity,
    invCountry,
    invCustomerNo,
    invNet,
    invServiceDate,
    invPickup,
    invDelivery,
    delStreet,
    delHouse,
    delPlz,
    delCity,
    delCountry,
  ]);

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
              customerEmail: invEmail,
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
              deliveryStreet: delStreet,
              deliveryHouseNumber: delHouse,
              deliveryPostalCode: delPlz,
              deliveryCity: delCity,
              deliveryCountry: delCountry || "Deutschland",
            }),
          });
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(j.error || t("common.requestFailed"));
          }
          const pack = (await res.json()) as {
            rechnung?: string;
            auftrag?: string;
            rechnungFilename?: string;
            auftragFilename?: string;
          };
          const savePdf = (b64: string, filename: string) => {
            const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
            const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
          };
          if (pack.rechnung) {
            savePdf(pack.rechnung, pack.rechnungFilename || "TransPool24-Rechnung.pdf");
          }
          await new Promise((r) => setTimeout(r, 450));
          if (pack.auftrag) {
            savePdf(pack.auftrag, pack.auftragFilename || "TransPool24-Auftragsbestaetigung.pdf");
          }
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
        <span className="mb-1 block font-medium text-[#0d2137]">{t("common.email")}</span>
        <input
          type="text"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          lang="de"
          value={invEmail}
          onChange={(e) => setInvEmail(e.target.value.replace(/\s/g, ""))}
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
      <p className="sm:col-span-2 lg:col-span-3 mt-2 text-sm font-semibold text-[#0d2137]">
        {t("reports.billingHeading")}
      </p>
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
      <p className="sm:col-span-2 lg:col-span-3 mt-2 text-sm font-semibold text-[#0d2137]">
        {t("reports.deliveryHeading")}
      </p>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.street")}</span>
        <input
          value={delStreet}
          onChange={(e) => setDelStreet(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.houseNumber")}</span>
        <input
          value={delHouse}
          onChange={(e) => setDelHouse(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.postalCode")}</span>
        <input
          value={delPlz}
          onChange={(e) => setDelPlz(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.city")}</span>
        <input
          value={delCity}
          onChange={(e) => setDelCity(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("common.country")}</span>
        <input
          value={delCountry}
          onChange={(e) => setDelCountry(e.target.value)}
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
          placeholder="1000,00"
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.serviceDate")}</span>
        <input
          type="date"
          dir="ltr"
          lang="de"
          value={invServiceDate}
          onChange={(e) => setInvServiceDate(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.colPickupTime")}</span>
        <input
          type="datetime-local"
          dir="ltr"
          lang="de"
          value={invPickup}
          onChange={(e) => setInvPickup(e.target.value)}
          className="w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#0d2137]">{t("reports.colDeliveryTime")}</span>
        <input
          type="datetime-local"
          dir="ltr"
          lang="de"
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
