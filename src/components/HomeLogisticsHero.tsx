import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

/** Default truck (delivery van) when CMS has no truck image — replace via Website → Hero → truck image. */
const DEFAULT_TRUCK_UNSPLASH =
  "https://images.unsplash.com/photo-1566576721346-d4a3b4b8ae2f?w=960&q=85&auto=format&fit=crop";

type Props = {
  locale: string;
  heroImage: string;
  /** When set, replaces the template headline (no orange split). */
  cmsHeadline: string | null;
  heroSubtitle: string;
  /** Primary hero button (e.g. GET STARTED / CMS CTA). */
  primaryCta: string;
  /** Secondary outline button (e.g. ABOUT US). */
  secondaryCta: string;
  truckImageUrl: string | null;
};

/** `clear` = sharp photo, dark band at bottom only (no orange wash, no blur). */
function HeroOverlapCard({
  title,
  description,
  readMore,
  href,
  imageUrl,
  overlay = "brand",
}: {
  title: string;
  description: string;
  readMore: string;
  href: string;
  imageUrl: string;
  overlay?: "brand" | "clear";
}) {
  const overlayClass =
    overlay === "clear"
      ? "bg-gradient-to-t from-black/[0.92] via-black/25 via-[42%] to-transparent"
      : "bg-gradient-to-t from-black/85 via-[var(--accent)]/55 to-[var(--accent)]/25";

  const textShell =
    overlay === "clear"
      ? "[text-shadow:0_1px_14px_rgba(0,0,0,0.9),0_0_1px_rgba(0,0,0,0.8)]"
      : "";

  return (
    <Link
      href={href}
      className="group relative flex min-h-[200px] w-[min(100%,280px)] flex-col justify-end overflow-hidden rounded-xl shadow-[0_20px_50px_-24px_rgba(0,0,0,0.45)] ring-1 ring-white/20 transition hover:-translate-y-0.5 sm:min-h-[220px] sm:w-[260px]"
    >
      <Image
        src={imageUrl}
        alt=""
        fill
        className="object-cover transition duration-500 group-hover:scale-105"
        sizes="280px"
        unoptimized={imageUrl.startsWith("http")}
      />
      <div className={`absolute inset-0 ${overlayClass}`} />
      <div className={`relative z-10 p-5 text-white ${textShell}`}>
        <h3 className="text-lg font-bold leading-snug text-[var(--accent)] drop-shadow-sm">{title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/90">{description}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-white">
          {readMore}
          <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

export async function HomeLogisticsHero({
  locale,
  heroImage,
  cmsHeadline,
  heroSubtitle,
  primaryCta,
  secondaryCta,
  truckImageUrl,
}: Props) {
  const t = await getTranslations({ locale, namespace: "home" });

  const truckSrc = truckImageUrl?.trim() || DEFAULT_TRUCK_UNSPLASH;
  /** Land-freight overlap card — DO Spaces (sharp photo; `overlay="clear"` avoids orange wash). */
  const cardImgRoad =
    "https://sk-bucket.sgp1.cdn.digitaloceanspaces.com/2022/04/24234214/shutterstock_637016899_censored.jpg";
  /** Second land-service card (no sea/air) — loading / last-mile visual */
  const cardImgLand2 =
    "https://images.unsplash.com/photo-1616432043562-7a89e2f4e936?w=600&q=80&auto=format&fit=crop";

  return (
    <section className="relative overflow-visible bg-white">
      <div className="relative min-h-[min(88vh,46rem)] lg:min-h-[38rem]">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt=""
            fill
            className="object-cover object-center"
            priority
            quality={heroImage.startsWith("http") ? 100 : 95}
            sizes="100vw"
            unoptimized={heroImage.startsWith("http")}
          />
          {/* Neutral darkening only — no orange wash or blur on the photo */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/58 to-black/38 rtl:bg-gradient-to-l" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[min(88vh,46rem)] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 sm:py-24 lg:min-h-[38rem] lg:py-28">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] sm:text-sm">
              {t("logisticsHero.kicker")}
            </p>
            {cmsHeadline?.trim() ? (
              <h1 className="mt-4 text-3xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.15rem]">
                {cmsHeadline.trim()}
              </h1>
            ) : (
              <h1 className="mt-4 text-3xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.15rem]">
                {t.rich("logisticsHero.titleRich", {
                  accent: (chunks) => <span className="text-[var(--accent)]">{chunks}</span>,
                })}
              </h1>
            )}
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/92 sm:text-lg">{heroSubtitle}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href={`/${locale}/order`}
                className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_14px_36px_-10px_rgba(232,93,4,0.65)] transition hover:bg-[var(--accent-hover)]"
              >
                {primaryCta}
              </Link>
              <Link
                href={`/${locale}/why`}
                className="inline-flex items-center justify-center rounded-md border-2 border-[var(--accent)] bg-transparent px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_0_1px_rgba(232,93,4,0.15)] transition hover:bg-[var(--accent)]/15"
              >
                {secondaryCta}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Overlap: freight cards + floating truck (mockup-style) */}
      <div className="relative z-30 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-8 pb-4 pt-2 lg:flex-row lg:items-end lg:justify-between lg:gap-6 lg:pb-10 lg:pt-0">
          <div className="order-2 flex w-full flex-wrap justify-center gap-4 lg:order-1 lg:justify-start">
            <HeroOverlapCard
              title={t("logisticsHero.cardRoadTitle")}
              description={t("logisticsHero.cardRoadDesc")}
              readMore={t("logisticsHero.cardReadMore")}
              href={`/${locale}/order`}
              imageUrl={cardImgRoad}
              overlay="clear"
            />
            <HeroOverlapCard
              title={t("logisticsHero.cardLand2Title")}
              description={t("logisticsHero.cardLand2Desc")}
              readMore={t("logisticsHero.cardReadMore")}
              href={`/${locale}/order`}
              imageUrl={cardImgLand2}
            />
          </div>

          <div className="order-1 flex w-full justify-center lg:order-2 lg:w-auto lg:justify-end lg:pe-4">
            <div className="relative isolate z-10 -mt-6 w-[min(100%,460px)] max-w-[min(100%,520px)] shrink-0 lg:-mt-28">
              {/*
                Explicit width/height (not fill) so the PNG always reserves space; fill + aspect box was collapsing
                for some transparent PNGs in production. Local /public assets use unoptimized for reliable alpha.
              */}
              <Image
                src={truckSrc}
                alt=""
                width={900}
                height={600}
                className="h-auto w-full max-h-[min(52vh,440px)] object-contain object-bottom"
                sizes="(max-width: 1024px) 92vw, 520px"
                priority
                unoptimized={truckSrc.startsWith("/") || truckSrc.startsWith("http")}
                style={{ filter: "drop-shadow(0 28px 40px rgba(0,0,0,0.3))" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
