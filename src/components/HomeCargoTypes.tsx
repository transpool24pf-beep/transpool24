"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export function HomeCargoTypes() {
  const t = useTranslations("home.cargoTypes");
  const locale = useLocale();
  const rtl = locale === "ar" || locale === "ku";

  const cards = [
    {
      src: "/images/cargo/kleinstsendungen.webp",
      title: t("kleinstTitle"),
      desc: t("kleinstDesc"),
    },
    {
      src: "/images/cargo/kurztouren.webp",
      title: t("kurzTitle"),
      desc: t("kurzDesc"),
    },
    {
      src: "/images/cargo/palette.webp",
      title: t("paletteTitle"),
      desc: t("paletteDesc"),
    },
    {
      src: "/images/cargo/teilladungen.webp",
      title: t("teilTitle"),
      desc: t("teilDesc"),
    },
  ];

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

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7">
          {cards.map((card) => (
            <li key={card.src}>
              <article className="flex h-full flex-col rounded-2xl border border-[#e85d04]/18 bg-gradient-to-b from-[#f7f7f8] to-[#ececee] px-8 pb-8 pt-10 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_18px_40px_-28px_rgba(13,33,55,0.18)]">
                <div className="relative mx-auto flex h-44 w-full max-w-[260px] items-center justify-center overflow-hidden rounded-xl bg-[#0c0c0c] ring-1 ring-black/20 sm:h-48">
                  <Image
                    src={card.src}
                    alt=""
                    fill
                    className="object-contain p-3"
                    sizes="260px"
                  />
                </div>
                <h3 className="mt-8 text-center text-lg font-semibold text-[#1a1a1a]">{card.title}</h3>
                <div className="mx-auto mt-4 flex w-full max-w-[16rem] items-center gap-3">
                  <span className="h-px flex-1 bg-[#cfcfd2]" />
                  <Link
                    href={`/${locale}/order`}
                    className="shrink-0 text-xs font-medium text-[#7a7a7e] underline-offset-2 transition hover:text-[#e85d04] hover:underline"
                  >
                    {t("example")}
                  </Link>
                  <span className="h-px flex-1 bg-[#cfcfd2]" />
                </div>
                <p className="mt-5 text-center text-sm leading-relaxed text-[#5a5a5e]">{card.desc}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
