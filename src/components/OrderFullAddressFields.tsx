"use client";

import type { ReactNode, Ref } from "react";
import type { StructuredAddress } from "@/lib/structured-address";

const COUNTRIES = ["Deutschland", "Österreich", "Schweiz", "Frankreich", "Niederlande", "Belgien", "Polen", "Italien"] as const;

const inputClass =
  "w-full rounded-lg border border-[#0d2137]/20 bg-white px-3 py-2 text-sm text-[#0d2137] placeholder:text-[#0d2137]/35 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";

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
  };
}) {
  const set = (patch: Partial<StructuredAddress>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-3 rounded-xl border border-[#0d2137]/10 bg-[#f7f8fb] p-4">
      <h3 className="text-sm font-semibold text-[#0d2137]">{title}</h3>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-[#0d2137]/80">{labels.company}</span>
        <input type="text" {...noBrowserFill} value={value.company} onChange={(e) => set({ company: e.target.value })} className={inputClass} />
      </label>
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
              className={inputClass}
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
            className={inputClass}
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
              className={inputClass}
            />
            {postalSuggestions}
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[#0d2137]/80">{labels.city}</span>
          <input type="text" {...noBrowserFill} value={value.city} onChange={(e) => set({ city: e.target.value })} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[#0d2137]/80">{labels.country}</span>
          <select
            value={COUNTRIES.includes(value.country as (typeof COUNTRIES)[number]) ? value.country : "Deutschland"}
            onChange={(e) => set({ country: e.target.value })}
            className={inputClass}
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
        <input type="text" {...noBrowserFill} value={value.notes} onChange={(e) => set({ notes: e.target.value })} className={inputClass} />
      </label>
    </div>
  );
}
