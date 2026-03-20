"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";

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
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-5 w-5 ${
            star <= rating
              ? "text-[var(--accent)]"
              : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function DriversCarousel() {
  const t = useTranslations("home.drivers");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch drivers from API
  useEffect(() => {
    fetch("/api/public/content/drivers")
      .then((r) => r.json())
      .then((data) => {
        setDrivers(data.drivers || []);
      })
      .catch(() => {
        // Fallback to empty array on error
        setDrivers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Generate demo drivers from translations when no real data
  const demoDrivers = useMemo((): Driver[] => {
    try {
      return [
        {
          id: -1,
          name: t("f1_name"),
          photo: t("f1_photo"),
          rating: 5, // Fixed rating from translation file
          comment: t("f1_comment"),
          customerName: t("f1_customerName"),
        },
        {
          id: -2,
          name: t("f2_name"),
          photo: t("f2_photo"),
          rating: 5, // Fixed rating from translation file
          comment: t("f2_comment"),
          customerName: t("f2_customerName"),
        },
        {
          id: -3,
          name: t("f3_name"),
          photo: t("f3_photo"),
          rating: 4, // Fixed rating from translation file
          comment: t("f3_comment"),
          customerName: t("f3_customerName"),
        },
      ];
    } catch (error) {
      console.error("Error loading demo drivers:", error);
      return [];
    }
  }, [t]);

  const displayDrivers = drivers.length > 0 ? drivers : demoDrivers;
  const isDemo = drivers.length === 0;

  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => checkScrollability());
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollability);
      window.addEventListener("resize", checkScrollability);
      return () => {
        cancelAnimationFrame(id);
        container.removeEventListener("scroll", checkScrollability);
        window.removeEventListener("resize", checkScrollability);
      };
    }
    return () => cancelAnimationFrame(id);
  }, [displayDrivers.length]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    const targetScroll =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;
    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <section className="bg-gradient-to-br from-gray-50 to-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-[var(--foreground)]/70">{t("loading")}</p>
          </div>
        </div>
      </section>
    );
  }

  // Always render the section with demo drivers if no real data
  return (
    <section className="bg-gradient-to-br from-gray-50 to-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--primary)] sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-[var(--foreground)]/70">
            {t("subtitle")}
          </p>
          {isDemo && (
            <p className="mt-2 text-sm text-[var(--foreground)]/50 italic">
              {t("demoNotice")}
            </p>
          )}
        </div>

        <div className="relative mt-16">
          {/* Navigation Buttons */}
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 shadow-lg transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed ${
              !canScrollLeft ? "hidden" : ""
            }`}
            aria-label="Previous"
          >
            <svg
              className="h-6 w-6 text-[var(--accent)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 shadow-lg transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed ${
              !canScrollRight ? "hidden" : ""
            }`}
            aria-label="Next"
          >
            <svg
              className="h-6 w-6 text-[var(--accent)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Carousel Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {displayDrivers.map((driver) => (
              <div
                key={driver.id}
                className="group min-w-[320px] max-w-[380px] flex-shrink-0 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Driver Photo */}
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-[var(--accent)]/20 bg-gray-100">
                    <Image
                      src={driver.photo}
                      alt={driver.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image fails
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          driver.name
                        )}&background=e85d04&color=fff&size=128`;
                      }}
                      unoptimized
                    />
                  </div>

                  {/* Driver Name */}
                  <h3 className="mt-6 text-xl font-bold text-[var(--primary)]">
                    {driver.name}
                  </h3>

                  {/* Star Rating */}
                  <div className="mt-3">
                    <StarRating rating={driver.rating} />
                  </div>

                  {/* Customer Comment */}
                  <p className="mt-6 text-[var(--foreground)]/70 leading-relaxed italic">
                    "{driver.comment}"
                  </p>

                  {/* Customer Name */}
                  <p className="mt-4 text-sm font-semibold text-[var(--foreground)]/60">
                    — {driver.customerName}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Dots */}
          <div className="mt-8 flex justify-center gap-2">
            {displayDrivers.map((_, index) => (
              <button
                key={index}
                type="button"
                className="h-2 w-2 rounded-full bg-gray-300 transition-all hover:bg-[var(--accent)]"
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
