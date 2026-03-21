"use client";

import Link from "next/link";
import { useId } from "react";
import { useTranslations } from "next-intl";

type Props = { locale: string };

/**
 * Stylized Germany map with animated connection lines between hub cities (Sennder-inspired layout).
 * Coordinates are in viewBox space; paths approximate intra-Germany flows.
 */
export function GermanyConnectSection({ locale }: Props) {
  const t = useTranslations("home.germanyMap");
  const clipId = useId().replace(/:/g, "");

  const hubs = [
    { cx: 248, cy: 52, key: "hamburg" },
    { cx: 318, cy: 78, key: "berlin" },
    { cx: 172, cy: 92, key: "nrw" },
    { cx: 198, cy: 118, key: "frankfurt" },
    { cx: 214, cy: 158, key: "stuttgart" },
    { cx: 268, cy: 188, key: "munich" },
  ] as const;

  const routes: { d: string; delay: string }[] = [
    {
      d: "M 248 52 Q 285 62 318 78",
      delay: "0s",
    },
    {
      d: "M 318 78 Q 250 85 172 92",
      delay: "0.4s",
    },
    {
      d: "M 172 92 Q 185 105 198 118",
      delay: "0.8s",
    },
    {
      d: "M 198 118 Q 206 138 214 158",
      delay: "1.2s",
    },
    {
      d: "M 214 158 Q 240 175 268 188",
      delay: "1.6s",
    },
    {
      d: "M 268 188 Q 265 120 248 52",
      delay: "2s",
    },
  ];

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
            <div className="relative aspect-square w-full max-w-[min(100%,420px)]">
              <div className="absolute inset-0 rounded-full bg-white/10 shadow-[inset_0_0_60px_rgba(0,0,0,0.15)] ring-1 ring-white/20" />
              <div className="relative flex h-full w-full items-center justify-center p-[10%]">
                <svg
                  viewBox="0 0 400 240"
                  className="h-auto w-full drop-shadow-lg"
                  role="img"
                  aria-label={t("mapAria")}
                >
                  <defs>
                    <clipPath id={clipId}>
                      <path d="M 155 28 L 210 22 L 268 32 L 312 48 L 338 72 L 348 98 L 342 128 L 352 152 L 338 178 L 318 198 L 288 212 L 252 218 L 218 214 L 188 205 L 162 188 L 138 158 L 128 122 L 132 88 L 142 52 Z" />
                    </clipPath>
                  </defs>

                  <path
                    fill="rgba(255,255,255,0.14)"
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth={1.2}
                    d="M 155 28 L 210 22 L 268 32 L 312 48 L 338 72 L 348 98 L 342 128 L 352 152 L 338 178 L 318 198 L 288 212 L 252 218 L 218 214 L 188 205 L 162 188 L 138 158 L 128 122 L 132 88 L 142 52 Z"
                  />

                  <g clipPath={`url(#${clipId})`}>
                    {routes.map((r, i) => (
                      <path
                        key={i}
                        d={r.d}
                        fill="none"
                        stroke="rgba(255,255,255,0.55)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeDasharray="6 14"
                        className="germany-map-flow-line"
                        style={{ animationDelay: r.delay }}
                      />
                    ))}
                  </g>

                  {hubs.map((h) => (
                    <circle
                      key={h.key}
                      cx={h.cx}
                      cy={h.cy}
                      r={5}
                      className="fill-white drop-shadow-md"
                    />
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
