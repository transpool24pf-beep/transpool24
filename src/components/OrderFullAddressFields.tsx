"use client";

import type { ReactNode, Ref } from "react";
import type { StructuredAddress } from "@/lib/structured-address";

const COUNTRIES = ["Deutschland", "Österreich", "Schweiz", "Frankreich", "Niederlande", "Belgien", "Polen", "Italien"] as const;

const inputOk =
  "w-full rounded-lg border border-[#0d2137]/20 bg-white px-3 py-2 text-sm text-[#0d2137] placeholder:text-[#0d2137]/35 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";
const inputMissing =
  "w-full rounded-lg border border-red-500 bg-red-50 px-3 py-2 text-sm text-[#0d2137] placeholder:text-[#0d2137]/35 ring-2 ring-red-400/70 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-500";

const noBrowserFill = {
  autoComplete: "off" as const,
  autoCorrect: "off" as const,
  autoCapitalize: "off" as const,
  spellCheck: false as const,
  "data-1p-ignore": true,
  "data-lpignore": "true",
  "data-form-type": "other",
};

export function OrderFullAddressFields({
  title,
  value,
  onChange,
  notesLabel,
  streetSuggestions,
  postalSuggestions,
  streetInputRef,
  postalInputRef,
  streetName,
  postalName,
  onStreetFocus,
  onPostalFocus,
  labels,
  highlightMissing = false,
  phoneRequired = false,
}: {
  title: string;
  value: StructuredAddress;
  onChange: (next: StructuredAddress) => void;
  notesLabel: string;
  streetSuggestions?: ReactNode;
  postalSuggestions?: ReactNode;
  streetInputRef?: Ref<HTMLInputElement>;
  postalInputRef?: Ref<HTMLInputElement>;
  streetName?: string;
  postalName?: string;
  onStreetFocus?: () => void;
  onPostalFocus?: () => void;
  labels: {
    company: string;
    street: string;
    streetPlaceholder: string;
    houseNumber: string;
    houseNumberPlaceholder: string;
    postalCode: string;
    city: string;
    country: string;
    phone?: string;
  };
  highlightMissing?: boolean;
  phoneRequired?: boolean;
}) {
  const set = (patch: Partial<StructuredAddress>) => onChange({ ...value, ...patch });
  const cls = (missing: boolean) => (highlightMissing && missing ? inputMissing : inputOk);
  const phoneMissing = (value.phone ?? "").replace(/\D/g, "").length < 6;
  const blockIncomplete =
    highlightMissing &&
    (value.street.trim().length < 2 ||
      value.houseNumber.trim().length < 1 ||
      !/^\d{5}$/.test(value.postalCode.trim()) ||
      value.city.trim().length < 2 ||
      (phoneRequired && phoneMissing));
  return (
    <div
      className={`space-y-3 rounded-xl border bg-[#f7f8fb] p-4 ${
        blockIncomplete ? "border-red-500 ring-2 ring-red-400/60" : "border-[#0d2137]/10"
      }`}
    >
      <h3 className="text-sm font-semibold text-[#0d2137]">{title}</h3>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-[#0d2137]/80">{labels.company}</span>
        <input type="text" {...noBrowserFill} value={value.company} onChange={(e) => set({ company: e.target.value })} className={inputOk} />
      </label>
      {labels.phone ? (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[#0d2137]/80">{labels.phone}</span>
          <input
            type="tel"
            {...noBrowserFill}
            value={value.phone ?? ""}
            onChange={(e) => set({ phone: e.target.value })}
            className={cls(Boolean(phoneRequired && phoneMissing))}
            aria-invalid={highlightMissing && phoneRequired && phoneMissing}
          />
        </label>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_7rem]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[#0d2137]/80">{labels.street}</span>
          <div className="relative">
            <input
              ref={streetInputRef}
              type="text"
              {...noBrowserFill}
              name={streetName}
              value={value.street}
              placeholder={labels.streetPlaceholder}
              onChange={(e) => set({ street: e.target.value })}
              onFocus={onStreetFocus}
              className={cls(value.street.trim().length < 2)}
              aria-invalid={highlightMissing && value.street.trim().length < 2}
            />
            {streetSuggestions}
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[#0d2137]/80">{labels.houseNumber}</span>
          <input
            type="text"
            {...noBrowserFill}
            value={value.houseNumber}
            placeholder={labels.houseNumberPlaceholder}
            onChange={(e) => set({ houseNumber: e.target.value })}
            className={cls(value.houseNumber.trim().length < 1)}
            aria-invalid={highlightMissing && value.houseNumber.trim().length < 1}
          />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[#0d2137]/80">{labels.postalCode}</span>
          <div className="relative">
            <input
              ref={postalInputRef}
              type="text"
              inputMode="numeric"
              maxLength={5}
              {...noBrowserFill}
              name={postalName}
              value={value.postalCode}
              placeholder="75172"
              onChange={(e) => set({ postalCode: e.target.value.replace(/\D/g, "").slice(0, 5) })}
              onFocus={onPostalFocus}
              className={cls(!/^\d{5}$/.test(value.postalCode.trim()))}
              aria-invalid={highlightMissing && !/^\d{5}$/.test(value.postalCode.trim())}
            />
            {postalSuggestions}
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[#0d2137]/80">{labels.city}</span>
          <input type="text" {...noBrowserFill} value={value.city} onChange={(e) => set({ city: e.target.value })} className={cls(value.city.trim().length < 2)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[#0d2137]/80">{labels.country}</span>
          <select
            value={COUNTRIES.includes(value.country as (typeof COUNTRIES)[number]) ? value.country : "Deutschland"}
            onChange={(e) => set({ country: e.target.value })}
            className={inputOk}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-[#0d2137]/80">{notesLabel}</span>
        <input type="text" {...noBrowserFill} value={value.notes} onChange={(e) => set({ notes: e.target.value })} className={inputOk} />
      </label>
    </div>
  );
}
