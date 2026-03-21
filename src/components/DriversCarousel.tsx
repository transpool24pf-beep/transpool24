"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

interface Driver {
  id: number;
  name: string;
  photo: string;
  rating: number;
  comment: string;
  customerName: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 sm:h-5 sm:w-5 ${star <= rating ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function isMiddleOfTriple(index: number, total: number) {
  if (total < 3) return false;
  return index % 3 === 1;
}

export function DriversCarousel() {
  const t = useTranslations("home.drivers");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/content/drivers")
      .then((r) => r.json())
      .then((data) => setDrivers(data.drivers || []))
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  }, []);

  const demoDrivers = useMemo((): Driver[] => {
    try {
      return [
        {
          id: -1,
          name: t("f1_name"),
          photo: t("f1_photo"),
          rating: 5,
          comment: t("f1_comment"),
          customerName: t("f1_customerName"),
        },
        {
          id: -2,
          name: t("f2_name"),
          photo: t("f2_photo"),
          rating: 5,
          comment: t("f2_comment"),
          customerName: t("f2_customerName"),
        },
        {
          id: -3,
          name: t("f3_name"),
          photo: t("f3_photo"),
          rating: 4,
          comment: t("f3_comment"),
          customerName: t("f3_customerName"),
        },
      ];
    } catch {
      return [];
    }
  }, [t]);

  const displayDrivers = drivers.length > 0 ? drivers : demoDrivers;
  const isDemo = drivers.length === 0;
  const total = displayDrivers.length;

  if (loading) {
    return (
      <section
        className="relative overflow-hidden rounded-tr-[2.75rem] bg-gradient-to-br from-[#0f3536] via-[#164848] to-[#0a2324] sm:rounded-tr-[4.5rem] md:rounded-tr-[5.5rem]"
        aria-busy="true"
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[var(--accent)]/10 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-center text-lg text-white/80">{t("loading")}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden rounded-tr-[2.75rem] bg-gradient-to-br from-[#0f3536] via-[#164848] to-[#0a2324] sm:rounded-tr-[4.5rem] md:rounded-tr-[5.5rem]"
      aria-labelledby="drivers-section-title"
    >
      <div
        className="pointer-events-none absolute -right-20 -top-28 h-96 w-96 rounded-full bg-[var(--accent)]/12 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-teal-400/5 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <h2
            id="drivers-section-title"
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            {t("title")}
          </h2>
          <p className="mt-3 text-lg text-white/85 sm:text-xl">{t("subtitle")}</p>
          {isDemo && (
            <p className="mt-2 text-sm text-white/55">{t("demoNotice")}</p>
          )}
        </div>

        <ul className="mt-12 grid list-none grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:mt-14 lg:grid-cols-3 lg:gap-8">
          {displayDrivers.map((driver, index) => {
            const highlighted = isMiddleOfTriple(index, total);
            return (
              <li key={driver.id} className="relative">
                {highlighted && (
                  <div
                    className="pointer-events-none absolute inset-0 -m-3 rounded-[1.35rem] bg-white/20 opacity-70 shadow-[0_0_60px_20px_rgba(255,255,255,0.12)] blur-xl sm:-m-4"
                    aria-hidden
                  />
                )}
                <article
                  dir={isRtl ? "rtl" : "ltr"}
                  className={`relative flex h-full flex-col rounded-2xl bg-white p-5 shadow-md ring-1 ring-black/[0.04] transition duration-300 sm:p-6 ${
                    highlighted ? "shadow-xl shadow-black/10 ring-white/40 sm:scale-[1.02]" : "hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-100 sm:h-14 sm:w-14">
                        <Image
                          src={driver.photo}
                          alt=""
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=e85d04&color=fff&size=128`;
                          }}
                          unoptimized
                        />
                      </div>
                      <h3 className="truncate text-base font-bold text-[var(--primary)] sm:text-lg">{driver.name}</h3>
                    </div>
                    <StarRating rating={driver.rating} />
                  </div>

                  <p className="mt-4 flex-1 text-start text-sm leading-relaxed text-[var(--foreground)]/75 sm:text-[0.9375rem]">
                    &ldquo;{driver.comment}&rdquo;
                  </p>
                  <p className="mt-4 text-start text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/50 sm:text-sm sm:normal-case sm:tracking-normal">
                    {driver.customerName}
                  </p>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
