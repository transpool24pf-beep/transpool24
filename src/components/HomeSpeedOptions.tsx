"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

function CheckIcon() {
  return (
    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e85d04]/12 text-[#e85d04]">
      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

function SpeedCard({
  variant,
}: {
  variant: "efficiency" | "express";
}) {
  const t = useTranslations("home.speedOptions");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const express = variant === "express";
  const points = [t(`${variant}P1`), t(`${variant}P2`), t(`${variant}P3`)];

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#e85d04]/16 bg-gradient-to-b from-[#f8f8f9] to-[#ececee] shadow-[0_1px_0_rgba(255,255,255,0.85)_inset,0_22px_44px_-30px_rgba(13,33,55,0.22)]">
      <div
        className={
          express
            ? "relative mx-5 mt-6 h-56 overflow-hidden rounded-xl bg-[#0c0c0c] ring-1 ring-black/15 sm:h-64"
            : "relative mx-5 mt-6 h-56 overflow-hidden rounded-xl bg-white/70 ring-1 ring-black/[0.04] sm:h-64"
        }
      >
        <Image
          src={express ? "/images/speed/express.jpg" : "/images/speed/efficiency.png"}
          alt=""
          fill
          className={express ? "object-contain p-2" : "object-contain p-3"}
          sizes="(max-width: 640px) 100vw, 420px"
        />
      </div>

      <div className="flex flex-1 flex-col px-7 pb-0 pt-7 sm:px-8">
        <h3 className="text-xl font-semibold text-[#1a1a1a]">{t(`${variant}Title`)}</h3>
        <p className="mt-3 text-sm leading-relaxed text-[#5a5a5e]">{t(`${variant}Lead`)}</p>

        <ul className="mt-6 space-y-3">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-sm leading-snug text-[#3f3f44]">
              <CheckIcon />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        {open ? <p className="mt-4 text-sm leading-relaxed text-[#5a5a5e]">{t(`${variant}More`)}</p> : null}

        <button
          type="button"
          className="mt-5 mb-5 inline-flex items-center gap-1.5 self-center text-xs font-medium text-[#8a8a8e] transition hover:text-[#e85d04]"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t("less") : t("more")}
          <svg
            className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <Link
        href={`/${locale}/order?service=${variant}`}
        className={
          express
            ? "mt-auto block bg-[#e85d04] py-3.5 text-center text-sm font-semibold text-white transition hover:brightness-110"
            : "mt-auto block bg-[#3a3a3e] py-3.5 text-center text-sm font-semibold text-white transition hover:bg-[#2c2c30]"
        }
      >
        {t(`${variant}Cta`)}
      </Link>
    </article>
  );
}

export function HomeSpeedOptions() {
  const t = useTranslations("home.speedOptions");
  const locale = useLocale();
  const rtl = locale === "ar" || locale === "ku";

  return (
    <section className="bg-white py-16 sm:py-24" dir={rtl ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold leading-snug tracking-tight text-[#1a1a1a] sm:text-3xl sm:leading-snug">
            {t("titleBefore")}{" "}
            <span className="inline-block rounded-full bg-[#e85d04]/22 px-3 py-0.5 font-semibold text-[#1a1a1a]">
              {t("titleHighlight")}
            </span>
            {t("titleAfter") ? ` ${t("titleAfter")}` : ""}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#5c5c5c] sm:text-[15px]">{t("subtitle")}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7">
          <SpeedCard variant="efficiency" />
          <SpeedCard variant="express" />
        </div>
      </div>
    </section>
  );
}
