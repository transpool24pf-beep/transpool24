"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { searchGermanyCities } from "@/lib/germany-cities";

export const CITY_OTHER = "Sonstige";

export function DriverCitySelect({
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  otherLabel,
  noResults,
}: {
  value: string;
  onChange: (city: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  otherLabel: string;
  noResults: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hi, setHi] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => searchGermanyCities(query, 60), [query]);
  const options = useMemo(() => [...matches, CITY_OTHER], [matches]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    setHi(0);
  }, [query, open]);

  const pick = (city: string) => {
    onChange(city);
    setOpen(false);
    setQuery("");
  };

  const display =
    value === CITY_OTHER ? otherLabel : value || "";

  return (
    <div className="relative" ref={wrapRef}>
      <input
        ref={inputRef}
        type="search"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls="driver-city-list"
        aria-autocomplete="list"
        value={open ? query : display}
        placeholder={open ? searchPlaceholder : placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
            setOpen(true);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHi((i) => Math.min(i + 1, options.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHi((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (options[hi]) pick(options[hi]);
          } else if (e.key === "Escape") {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
        className="w-full rounded-xl border border-[#0d2137]/20 bg-white px-4 py-3 pe-10"
      />
      <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-[#0d2137]/40" aria-hidden>
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
      </span>

      {open ? (
        <ul
          id="driver-city-list"
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-[#0d2137]/15 bg-white py-1 shadow-lg"
        >
          {matches.length === 0 ? (
            <li className="px-4 py-2 text-sm text-[#0d2137]/55">{noResults}</li>
          ) : null}
          {options.map((city, i) => {
            const isOther = city === CITY_OTHER;
            const selected = value === city;
            return (
              <li key={city} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onMouseEnter={() => setHi(i)}
                  onClick={() => pick(city)}
                  className={`flex w-full items-center justify-between px-4 py-2 text-start text-sm ${
                    i === hi ? "bg-[#e85d04]/12 text-[#0d2137]" : "text-[#0d2137]"
                  } ${isOther ? "mt-1 border-t border-[#0d2137]/10 font-medium" : ""}`}
                >
                  <span>{isOther ? otherLabel : city}</span>
                  {selected ? <span className="text-[var(--accent)]">✓</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
