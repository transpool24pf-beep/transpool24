import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const IMG_A =
  "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=700&q=80&auto=format&fit=crop";
const IMG_B =
  "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=600&q=80&auto=format&fit=crop";
const IMG_C =
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80&auto=format&fit=crop";

export async function HomeAboutCollage({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Collage — asymmetric grid like template */}
          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="grid grid-cols-12 gap-3 sm:gap-4">
              <div className="relative col-span-7 row-span-2 min-h-[220px] overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 sm:min-h-[280px]">
                <Image src={IMG_A} alt="" fill className="object-cover" sizes="(max-width: 1024px) 70vw, 400px" />
              </div>
              <div className="relative col-span-5 min-h-[120px] overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5 sm:min-h-[140px]">
                <Image src={IMG_B} alt="" fill className="object-cover" sizes="(max-width: 1024px) 40vw, 280px" />
              </div>
              <div className="relative col-span-12 min-h-[140px] overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5 sm:min-h-[160px]">
                <Image src={IMG_C} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 640px" />
              </div>
            </div>

            <div className="absolute left-1/2 top-1/2 z-10 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-xl bg-[var(--accent)] p-4 text-center shadow-[0_20px_50px_-12px_rgba(232,93,4,0.55)] sm:h-40 sm:w-40">
              <svg
                className="h-8 w-8 text-white opacity-95"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <p className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">{t("logisticsHero.statValue")}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase leading-tight tracking-wide text-white/95 sm:text-xs">
                {t("logisticsHero.statLabel")}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
              {t("logisticsHero.aboutKicker")}
            </p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-[#1a1a1a] sm:text-4xl">
              {t.rich("logisticsHero.aboutTitleRich", {
                accent: (chunks) => <span className="text-[var(--accent)]">{chunks}</span>,
              })}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[#5c5c5c] sm:text-lg">{t("logisticsHero.aboutLead")}</p>

            <ul className="mt-8 space-y-6">
              <li className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                </span>
                <div>
                  <h3 className="font-bold text-[#1a1a1a]">{t("logisticsHero.aboutBullet1Title")}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#6b6b6b]">{t("logisticsHero.aboutBullet1Desc")}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </span>
                <div>
                  <h3 className="font-bold text-[#1a1a1a]">{t("logisticsHero.aboutBullet2Title")}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#6b6b6b]">{t("logisticsHero.aboutBullet2Desc")}</p>
                </div>
              </li>
            </ul>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href={`/${locale}/why`}
                className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_12px_28px_-8px_rgba(232,93,4,0.55)] transition hover:bg-[var(--accent-hover)]"
              >
                {t("logisticsHero.discoverMore")}
              </Link>
              <Link
                href={`/${locale}/why`}
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--accent)] text-[var(--accent)] transition hover:bg-[var(--accent)]/10"
                aria-label={t("logisticsHero.discoverMore")}
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
