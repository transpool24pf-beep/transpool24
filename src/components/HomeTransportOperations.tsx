"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

const SERVICE_TILES = [
  { id: "s1", image: "/images/services/appliance-wrap.jpg" },
  { id: "s2", image: "/images/services/handtruck-packed.jpg" },
  { id: "s3", image: "/images/services/household-move.jpg" },
  { id: "s4", image: "/images/services/kitchen-move.jpg" },
  { id: "s5", image: "/images/services/disposal.jpg" },
  { id: "s6", image: "/images/services/bulky-waste.jpg" },
  { id: "s7", image: "/images/services/express-pallet.jpg" },
  { id: "s8", image: "/images/services/packed-furniture.jpg" },
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
                <article className="relative h-full origin-center transform-gpu rounded-2xl bg-white shadow-[0_12px_40px_rgba(13,33,55,0.08)] ring-1 ring-[#0d2137]/8 transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:z-20 group-hover:-translate-y-3 group-hover:scale-[1.07] group-hover:shadow-[0_28px_60px_rgba(13,33,55,0.18)] group-hover:ring-[var(--accent)]/35">
                  <div className="overflow-hidden rounded-2xl">
                    <div className="relative aspect-[4/5] bg-[#f4f6f8]">
                      <Image
                        src={tile.image}
                        alt={title}
                        fill
                        className="object-contain p-3 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-125 sm:p-4"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>
                    <div className="border-t border-[#0d2137]/6 px-3 py-3 sm:px-4 sm:py-4">
                      <p className="text-center text-sm font-bold leading-snug text-[#0d2137] sm:text-base">
                        {title}
                      </p>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
