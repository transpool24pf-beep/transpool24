"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

const SERVICE_TILES = [
  { id: "s1", image: "/images/services/appliance-wrap.webp" },
  { id: "s2", image: "/images/services/handtruck-packed.webp" },
  { id: "s3", image: "/images/services/household-move.webp" },
  { id: "s4", image: "/images/services/kitchen-move.webp" },
  { id: "s5", image: "/images/services/disposal.webp" },
  { id: "s6", image: "/images/services/bulky-waste.webp" },
  { id: "s7", image: "/images/services/express-pallet.webp" },
  { id: "s8", image: "/images/services/packed-furniture.webp" },
  { id: "s9", image: "/images/services/engine-pallet.webp" },
  { id: "s10", image: "/images/services/carton-pallet.webp" },
  { id: "s11", image: "/images/services/b2b.webp" },
  { id: "s12", image: "/images/services/barrel-pallet.webp" },
] as const;

export function HomeTransportOperations() {
  const t = useTranslations("home.transportOps");
  const locale = useLocale();

  return (
    <section className="relative overflow-x-clip bg-gradient-to-b from-white via-[#f7f8fa] to-[#eef1f4] py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle at 18% 12%, rgba(232,93,4,0.07), transparent 42%),
            radial-gradient(circle at 88% 70%, rgba(13,33,55,0.05), transparent 38%)`,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--primary)] sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-[var(--foreground)]/70">{t("subtitle")}</p>
        </div>

        <div
          className="mt-14 grid grid-cols-2 gap-4 py-6 sm:gap-6 sm:py-8 lg:grid-cols-4 lg:gap-7"
          style={{ perspective: "1400px" }}
        >
          {SERVICE_TILES.map((tile) => {
            const title = t(`${tile.id}_title`);
            return (
              <Link
                key={tile.id}
                href={`/${locale}/order`}
                className="group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-4"
              >
                <article className="relative h-full origin-center transform-gpu rounded-2xl bg-transparent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:z-20 group-hover:-translate-y-3 group-hover:scale-[1.07]">
                  <div className="relative aspect-[4/5] overflow-visible bg-transparent">
                    <Image
                      src={tile.image}
                      alt={title}
                      fill
                      className="object-contain drop-shadow-[0_18px_28px_rgba(13,33,55,0.18)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-125"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                  <p className="mt-3 px-1 text-center text-sm font-bold leading-snug text-[#0d2137] sm:mt-4 sm:text-base">
                    {title}
                  </p>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
