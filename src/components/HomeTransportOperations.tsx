"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Tile = { id: number; title: string; imageUrl: string };

export function HomeTransportOperations() {
  const t = useTranslations("home.transportOps");
  const locale = useLocale();
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/content/transport-tiles")
      .then((r) => r.json())
      .then((data) => setTiles(data.tiles || []))
      .catch(() => setTiles([]))
      .finally(() => setLoading(false));
  }, []);

  const demoTiles: Tile[] = useMemo(
    () => [
      { id: -1, title: t("d1_title"), imageUrl: "/images/445.png" },
      { id: -2, title: t("d2_title"), imageUrl: "/images/5677.png" },
      { id: -3, title: t("d3_title"), imageUrl: "/images/445.png" },
      { id: -4, title: t("d4_title"), imageUrl: "/images/5677.png" },
    ],
    [t],
  );

  const display = tiles.length > 0 ? tiles : demoTiles;
  const isDemo = tiles.length === 0;

  if (loading) {
    return (
      <section className="bg-gradient-to-b from-white to-[#f4f6f8] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-[var(--foreground)]/60">{t("loading")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#fafbfc] to-[#eef1f4] py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(232,93,4,0.08), transparent 45%),
            radial-gradient(circle at 80% 60%, rgba(13,33,55,0.06), transparent 40%)`,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--primary)] sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-[var(--foreground)]/70">{t("subtitle")}</p>
          {isDemo && (
            <p className="mt-2 text-sm italic text-[var(--foreground)]/50">{t("demoNotice")}</p>
          )}
        </div>

        <div className="mt-14 grid grid-cols-2 gap-5 sm:gap-7 lg:grid-cols-4">
          {display.map((tile) => (
            <Link
              key={tile.id}
              href={`/${locale}/order`}
              className="group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            >
              {/* Decorative outer frame */}
              <div className="relative rounded-[1.35rem] bg-gradient-to-br from-[var(--accent)] via-[#f5a623] to-[#ff8c42] p-[3px] shadow-lg shadow-[var(--accent)]/20 transition duration-300 group-hover:shadow-xl group-hover:shadow-[var(--accent)]/30">
                <div className="relative overflow-hidden rounded-[1.2rem] bg-[#0d2137] ring-1 ring-white/10">
                  {/* Inner ornament corners */}
                  <div className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute left-2 top-2 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-white/50" />
                    <div className="absolute right-2 top-2 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-white/50" />
                    <div className="absolute bottom-2 left-2 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-white/50" />
                    <div className="absolute bottom-2 right-2 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-white/50" />
                  </div>

                  <div className="relative aspect-[3/4] w-full sm:aspect-[4/5]">
                    <Image
                      src={tile.imageUrl}
                      alt=""
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      unoptimized={tile.imageUrl.startsWith("http")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d2137]/95 via-[#0d2137]/25 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 z-20 p-4 pt-12 sm:p-5">
                      <p className="text-center text-sm font-bold leading-snug text-white drop-shadow-md sm:text-base">
                        {tile.title}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
