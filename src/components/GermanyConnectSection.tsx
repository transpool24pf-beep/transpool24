"use client";

import Link from "next/link";
import { useId, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  GERMANY_LANDS,
  GERMANY_STATES_VIEWBOX,
  germanyLandLoopRoutes,
} from "@/lib/germany-states-map";

type Props = { locale: string };

/**
 * Germany with all 16 Bundesländer (real administrative boundaries) + animated inter-state lines.
 */
export function GermanyConnectSection({ locale }: Props) {
  const t = useTranslations("home.germanyMap");
  const clipId = useId().replace(/:/g, "");
  const routes = useMemo(() => germanyLandLoopRoutes(), []);

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-[#e85d04] via-[var(--accent)] to-[#c44a00] py-20 text-white sm:py-28"
      aria-labelledby="germany-map-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(255,255,255,0.12),transparent_55%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
              {t("eyebrow")}
            </p>
            <h2
              id="germany-map-heading"
              className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl"
            >
              {t("headline")}
            </h2>

            <div className="mt-10 space-y-8">
              <blockquote className="border-s-4 border-white/70 ps-5 text-lg leading-relaxed text-white/95 sm:text-xl">
                {t("body1")}
              </blockquote>
              <blockquote className="border-s-4 border-white/70 ps-5 text-lg leading-relaxed text-white/95 sm:text-xl">
                {t("body2")}
              </blockquote>
              <div className="border-s-4 border-white ps-5">
                <p className="text-xl font-bold sm:text-2xl">{t("speedTitle")}</p>
                <p className="mt-2 text-base text-white/90 sm:text-lg">{t("speedDesc")}</p>
              </div>
            </div>

            <div className="mt-10">
              <Link
                href={`/${locale}/order`}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[var(--accent)] shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
              >
                {t("cta")}
                <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
            <div className="relative aspect-square w-full max-w-[min(100%,460px)]">
              <div className="absolute inset-0 rounded-full bg-white/10 shadow-[inset_0_0_60px_rgba(0,0,0,0.15)] ring-1 ring-white/20" />
              <div className="relative flex h-full w-full items-center justify-center p-[6%] sm:p-[8%]">
                <svg
                  viewBox={GERMANY_STATES_VIEWBOX}
                  preserveAspectRatio="xMidYMid meet"
                  className="h-auto w-full max-h-[min(100%,440px)] drop-shadow-lg"
                  role="img"
                  aria-label={t("mapAria")}
                >
                  <defs>
                    <clipPath id={clipId}>
                      {GERMANY_LANDS.map((s) => (
                        <path key={s.id} d={s.path} />
                      ))}
                    </clipPath>
                  </defs>

                  {GERMANY_LANDS.map((s) => (
                    <path
                      key={s.id}
                      d={s.path}
                      fill="rgba(255,255,255,0.07)"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth={1.1}
                      className="transition-colors duration-200 hover:fill-white/15"
                    />
                  ))}

                  <g clipPath={`url(#${clipId})`}>
                    {routes.map((r, i) => (
                      <path
                        key={i}
                        d={r.d}
                        fill="none"
                        stroke="rgba(255,255,255,0.65)"
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeDasharray="10 18"
                        className="germany-map-flow-line"
                        style={{ animationDelay: r.delay }}
                      />
                    ))}
                  </g>

                  {GERMANY_LANDS.map((s) => (
                    <circle key={`dot-${s.id}`} cx={s.cx} cy={s.cy} r={3.8} className="fill-white/95" />
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
