"use client";

import { useEffect, useRef } from "react";
import {
  ensureDotlottieScript,
  HEADER_CAR_LOTTIE_SRC,
  waitForDotlottieWcRegistered,
} from "@/lib/dotlottie-wc-script";

/**
 * Same Lottie van as desktop: crosses the header bar left → right.
 * Position is driven with requestAnimationFrame so iOS Safari moves it
 * (CSS `left` / sometimes even CSS transform on sticky headers will not).
 */
export function HeaderCarLottieTrack() {
  const mountRef = useRef<HTMLDivElement>(null);
  const riderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;
    let el: HTMLElement | null = null;
    let cancelled = false;

    (async () => {
      try {
        await ensureDotlottieScript();
        const ok = await waitForDotlottieWcRegistered();
        if (cancelled || !ok || !host) return;
        el = document.createElement("dotlottie-wc") as HTMLElement;
        el.setAttribute("src", HEADER_CAR_LOTTIE_SRC);
        el.setAttribute("autoplay", "");
        el.setAttribute("loop", "");
        el.setAttribute("background", "transparent");
        el.style.width = "300px";
        el.style.height = "300px";
        el.style.display = "block";
        host.appendChild(el);
      } catch {
        /* optional decoration */
      }
    })();

    return () => {
      cancelled = true;
      if (el && host.contains(el)) host.removeChild(el);
    };
  }, []);

  useEffect(() => {
    const rider = riderRef.current;
    if (!rider) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rider.style.transform = `translate3d(${Math.round(window.innerWidth * 0.35)}px,0,0)`;
      return;
    }

    rider.style.animation = "none";
    rider.style.webkitAnimation = "none";

    let raf = 0;
    let start: number | null = null;
    const duration = 18000;

    const tick = (now: number) => {
      if (start == null) start = now;
      const p = ((now - start) % duration) / duration;
      const track = rider.parentElement;
      const w = track?.clientWidth || window.innerWidth;
      const x = -280 + p * (w + 560);
      rider.style.transform = `translate3d(${x}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="header-bar-car-layer pointer-events-none absolute inset-0 z-20 overflow-hidden lg:z-0"
      dir="ltr"
      aria-hidden
    >
      <div className="header-bar-car-rider" ref={riderRef}>
        <div className="header-bar-car-inner">
          {/* Lottie art sits high in the 300×300 frame; nudge down so wheels sit on header bottom line */}
          <div className="header-bar-car-nudge">
            <div className="header-bar-car-mount" ref={mountRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
