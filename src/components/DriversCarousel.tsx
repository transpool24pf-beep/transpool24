"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DriversLottieBackdrop } from "@/components/DriversLottieBackdrop";

interface Driver {
  id: number;
  name: string;
  photo: string;
  rating: number;
  comment: string;
  customerName: string;
}

function StarRating({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={`flex shrink-0 items-center gap-0.5 ${className ?? ""}`} aria-hidden>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${star <= rating ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

/** Deterministic star positions (no SSR/client mismatch). */
function Starfield() {
  const stars = useMemo(() => {
    return Array.from({ length: 72 }, (_, i) => {
      const x = ((i * 47 + 13) % 100) + (i % 7) * 0.35;
      const y = ((i * 71 + 29) % 100) + (i % 5) * 0.2;
      const r = 1 + (i % 4) * 0.35;
      const o = 0.15 + (i % 6) * 0.12;
      return { x, y, r, o };
    });
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.r,
            height: s.r,
            opacity: s.o,
          }}
        />
      ))}
    </div>
  );
}

function SideDriverCard({
  driver,
  onSelect,
  isRtl,
  ariaLabel,
}: {
  driver: Driver;
  onSelect: () => void;
  isRtl: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={ariaLabel}
      className="group relative z-0 w-[4.5rem] shrink-0 scale-[0.82] cursor-pointer overflow-hidden rounded-2xl border border-white/15 bg-white/95 p-2.5 shadow-lg transition hover:scale-[0.88] hover:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 sm:w-[5.75rem] md:w-32 md:p-3 opacity-[0.52] md:opacity-60"
    >
      <div
        className="flex flex-col items-center gap-1.5 blur-[1.5px] transition group-hover:blur-[0.5px] group-focus-visible:blur-[0.5px]"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-100 md:h-11 md:w-11">
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
        <StarRating rating={driver.rating} />
      </div>
    </button>
  );
}

function MainDriverBubble({
  driver,
  isRtl,
  reviewLead,
}: {
  driver: Driver;
  isRtl: boolean;
  reviewLead: string;
}) {
  return (
    <article
      dir={isRtl ? "rtl" : "ltr"}
      className="relative z-10 mx-auto w-full max-w-[min(100%,22rem)] sm:max-w-md md:max-w-lg"
    >
      <div className="relative pb-3 sm:pb-4">
        <div className="relative rounded-2xl border border-white/20 bg-white px-5 py-5 shadow-2xl shadow-black/25 sm:px-7 sm:py-6 md:px-8 md:py-7">
          <p className="text-center text-[11px] font-medium leading-snug text-[var(--foreground)]/45 sm:text-xs">
            {reviewLead}
          </p>
          <div className="mt-3 flex items-center justify-center gap-3 sm:mt-4 sm:gap-4">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-100 ring-2 ring-[var(--accent)]/25 sm:h-14 sm:w-14">
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
            <div className="min-w-0 flex-1 text-start">
              <h3 className="truncate text-base font-bold text-[var(--primary)] sm:text-lg">{driver.name}</h3>
              <StarRating rating={driver.rating} className="mt-1" />
            </div>
          </div>
          <p className="mt-4 text-start text-sm leading-relaxed text-[var(--foreground)]/80 sm:mt-5 sm:text-[0.9375rem]">
            &ldquo;{driver.comment}&rdquo;
          </p>
          <p className="mt-4 text-start text-xs font-semibold text-[var(--foreground)]/45 sm:text-sm">
            {driver.customerName}
          </p>
        </div>
        <div
          className="pointer-events-none absolute left-1/2 top-full z-0 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[12px] border-x-transparent border-t-white [filter:drop-shadow(0_4px_6px_rgba(0,0,0,0.12))] sm:border-x-[12px] sm:border-t-[14px]"
          aria-hidden
        />
      </div>
    </article>
  );
}

export function DriversCarousel() {
  const t = useTranslations("home.drivers");
  const locale = useLocale();
  const isRtl = locale === "ar" || locale === "ku";
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const dragRef = useRef<{ x: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/public/content/drivers", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setDrivers(data.drivers || []))
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  }, []);

  const demoDrivers = useMemo((): Driver[] => {
    try {
      const triple: Driver[] = [
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
      return Array.from({ length: 6 }, (_, i) => {
        const b = triple[i % 3];
        return {
          ...b,
          id: -(i + 1),
          name: i < 3 ? b.name : `${b.name}\u00A0·\u00A0${i + 1}`,
        };
      });
    } catch {
      return [];
    }
  }, [t]);

  const displayDrivers = drivers.length > 0 ? drivers : demoDrivers;
  const isDemo = drivers.length === 0;
  const n = displayDrivers.length;

  const [slideDir, setSlideDir] = useState<"next" | "prev" | null>(null);
  const [interactionPause, setInteractionPause] = useState(false);
  const userPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bumpUserPause = useCallback(() => {
    if (userPauseTimerRef.current) clearTimeout(userPauseTimerRef.current);
    setInteractionPause(true);
    userPauseTimerRef.current = setTimeout(() => {
      setInteractionPause(false);
      userPauseTimerRef.current = null;
    }, 8500);
  }, []);

  useEffect(() => {
    return () => {
      if (userPauseTimerRef.current) clearTimeout(userPauseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (n === 0) return;
    setIndex((i) => Math.min(i, Math.max(0, n - 1)));
  }, [n]);

  const prevIdx = n > 0 ? (index - 1 + n) % n : 0;
  const nextIdx = n > 0 ? (index + 1) % n : 0;

  const userPrev = useCallback(() => {
    if (n < 2) return;
    bumpUserPause();
    setSlideDir("prev");
    setIndex((i) => (i - 1 + n) % n);
  }, [n, bumpUserPause]);

  const userNext = useCallback(() => {
    if (n < 2) return;
    bumpUserPause();
    setSlideDir("next");
    setIndex((i) => (i + 1) % n);
  }, [n, bumpUserPause]);

  const goToIndex = useCallback(
    (target: number) => {
      if (n < 2 || target === index || target < 0 || target >= n) return;
      bumpUserPause();
      const forward = (target - index + n) % n;
      const backward = (index - target + n) % n;
      setSlideDir(forward <= backward ? "next" : "prev");
      setIndex(target);
    },
    [n, index, bumpUserPause]
  );

  useEffect(() => {
    if (n < 2 || interactionPause) return;
    const id = window.setInterval(() => {
      setSlideDir("next");
      setIndex((i) => (i + 1) % n);
    }, 4500);
    return () => window.clearInterval(id);
  }, [n, interactionPause]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX };
    const el = trackRef.current;
    if (el && typeof el.setPointerCapture === "function") {
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const start = dragRef.current;
    dragRef.current = null;
    if (!start || n < 2) return;
    const dx = e.clientX - start.x;
    const threshold = 40;
    if (dx > threshold) userPrev();
    else if (dx < -threshold) userNext();
  };

  const leftDriver = isRtl ? displayDrivers[nextIdx] : displayDrivers[prevIdx];
  const rightDriver = isRtl ? displayDrivers[prevIdx] : displayDrivers[nextIdx];
  const active = displayDrivers[index] ?? displayDrivers[0];

  const shellClass =
    "relative overflow-hidden rounded-tr-[2.75rem] sm:rounded-tr-[4.5rem] md:rounded-tr-[5.5rem]";

  if (loading) {
    return (
      <section className={shellClass} aria-busy="true">
        <div className="absolute inset-0 bg-gradient-to-br from-[#061a1c] via-[#0f3536] to-[#0a2324]" />
        <DriversLottieBackdrop />
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#061a1c]/45 via-[#061a1c]/25 to-[#061a1c]/55"
          aria-hidden
        />
        <Starfield />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-center text-lg text-white/80">{t("loading")}</p>
        </div>
      </section>
    );
  }

  if (n === 0) {
    return null;
  }

  const reviewLead = t("reviewLead", { customer: active.customerName });

  const enterClass =
    slideDir === "next" ? "drivers-carousel-enter-next" : slideDir === "prev" ? "drivers-carousel-enter-prev" : "";

  return (
    <section
      className={shellClass}
      dir={isRtl ? "rtl" : "ltr"}
      aria-labelledby="drivers-section-title"
      aria-roledescription="carousel"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#061a1c] via-[#0f3536] to-[#0a2324]" />
      <DriversLottieBackdrop />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#061a1c]/45 via-[#061a1c]/25 to-[#061a1c]/55"
        aria-hidden
      />
      <Starfield />
      <div
        className="pointer-events-none absolute -right-20 -top-28 z-[2] h-96 w-96 rounded-full bg-[var(--accent)]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-0 z-[2] h-72 w-72 rounded-full bg-teal-400/5 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <h2
            id="drivers-section-title"
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            {t("title")}
          </h2>
          <p className="mt-3 text-lg text-white/85 sm:text-xl">{t("subtitle")}</p>
          {isDemo && <p className="mt-2 text-sm text-white/55">{t("demoNotice")}</p>}
        </div>

        <div
          ref={trackRef}
          className="mt-12 flex touch-manipulation items-center justify-center gap-2 sm:mt-14 md:gap-4 lg:mt-16"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
        >
          {n > 1 && (
            <button
              type="button"
              onClick={userPrev}
              className="z-20 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-md backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:h-11 sm:w-11"
              aria-label={t("carouselPrev")}
            >
              <span className="text-lg leading-none rtl:rotate-180 sm:text-xl" aria-hidden>
                ‹
              </span>
            </button>
          )}

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:gap-3 md:gap-6">
            {n > 1 && (
              <SideDriverCard
                driver={leftDriver}
                onSelect={userPrev}
                isRtl={isRtl}
                ariaLabel={t("carouselPrev")}
              />
            )}
            <div className={`min-w-0 max-w-full flex-1 ${enterClass}`} key={index}>
              <MainDriverBubble driver={active} isRtl={isRtl} reviewLead={reviewLead} />
            </div>
            {n > 1 && (
              <SideDriverCard
                driver={rightDriver}
                onSelect={userNext}
                isRtl={isRtl}
                ariaLabel={t("carouselNext")}
              />
            )}
          </div>

          {n > 1 && (
            <button
              type="button"
              onClick={userNext}
              className="z-20 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-md backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:h-11 sm:w-11"
              aria-label={t("carouselNext")}
            >
              <span className="text-lg leading-none rtl:rotate-180 sm:text-xl" aria-hidden>
                ›
              </span>
            </button>
          )}
        </div>

        {n > 1 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:mt-10" role="tablist" aria-label={t("carouselDotsAria")}>
            {displayDrivers.map((d, i) => (
              <button
                key={d.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={t("carouselGoTo", { index: i + 1 })}
                onClick={() => goToIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-8 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.45)]" : "w-5 bg-white/25 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        )}

        <div className="drivers-cta-shell mx-auto mt-14 max-w-3xl sm:mt-16 lg:mt-20">
          <div className="drivers-cta-inner px-5 py-6 sm:px-8 sm:py-8">
            <p className="text-center text-xl font-extrabold leading-tight text-white sm:text-2xl">
              {t("ctaTitle")}
            </p>
            <p className="mt-4 text-center text-sm leading-relaxed text-white/88 sm:text-base">
              {t("ctaBody")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
