"use client";

import Script from "next/script";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DOTLOTTIE_HOME_DRIVER_LOGISTICS, DOTLOTTIE_WC_SCRIPT } from "@/lib/dotlottie-assets";

/**
 * Full-width responsive DotLottie band below the homepage “join drivers” CTA.
 * Uses customElements.whenDefined (same pattern as OrderRouteLottie) + ResizeObserver for width.
 */
export function HomepageDriverLogisticsLottie() {
  const [playerReady, setPlayerReady] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const markReady = () => setPlayerReady(true);
    if (customElements.get("dotlottie-wc")) {
      markReady();
      return;
    }
    let cancelled = false;
    customElements.whenDefined("dotlottie-wc").then(() => {
      if (!cancelled) markReady();
    });
    const fallback = window.setTimeout(() => {
      if (!cancelled && customElements.get("dotlottie-wc")) markReady();
    }, 12_000);
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, []);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w < 8) return;
      const h = Math.min(Math.max(Math.round(w * 0.42), 200), 440);
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!playerReady || !hostRef.current || size.w < 8) return;
    const host = hostRef.current;
    host.replaceChildren();
    const el = document.createElement("dotlottie-wc");
    el.setAttribute("src", DOTLOTTIE_HOME_DRIVER_LOGISTICS);
    el.setAttribute("autoplay", "");
    el.setAttribute("loop", "");
    el.style.width = `${size.w}px`;
    el.style.height = `${size.h}px`;
    el.style.display = "block";
    el.style.maxWidth = "100%";
    host.appendChild(el);
    return () => {
      host.replaceChildren();
    };
  }, [playerReady, size.w, size.h]);

  return (
    <section
      className="w-full border-t border-[#0d2137]/10 bg-gradient-to-b from-white via-[#f7f9fc] to-[#e8edf4] py-10 sm:py-14"
      aria-hidden
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          ref={wrapRef}
          className="w-full overflow-hidden rounded-2xl border border-[#0d2137]/8 bg-white/80 shadow-[0_12px_40px_-12px_rgba(13,33,55,0.15)] backdrop-blur-sm"
        >
          <Script src={DOTLOTTIE_WC_SCRIPT} strategy="afterInteractive" type="module" />
          <div
            className="relative flex w-full justify-center py-4 sm:py-6"
            style={{ minHeight: size.h > 0 ? size.h + 32 : 220 }}
          >
            {!playerReady && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span
                  className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)]/25 border-t-[var(--accent)]"
                  aria-hidden
                />
              </div>
            )}
            <div ref={hostRef} className="relative z-[1] shrink-0" style={{ width: size.w, height: size.h }} />
          </div>
        </div>
      </div>
    </section>
  );
}
