"use client";

import { useEffect, useRef } from "react";

const HEADER_VAN_JSON = "/lottie/header-van.json";
const LOOP_MS = 18000;

/**
 * Same header van as desktop, drawn with lottie-web SVG (works on iOS).
 * Slides left → right over the toolbar, including across the phone buttons.
 */
export function HeaderCarLottieTrack() {
  const hostRef = useRef<HTMLDivElement>(null);
  const riderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let anim: { destroy: () => void } | null = null;
    let cancelled = false;

    (async () => {
      const lottie = (await import("lottie-web")).default;
      if (cancelled || !hostRef.current) return;
      host.innerHTML = "";
      anim = lottie.loadAnimation({
        container: host,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: HEADER_VAN_JSON,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
        },
      });
    })();

    return () => {
      cancelled = true;
      anim?.destroy();
    };
  }, []);

  useEffect(() => {
    const rider = riderRef.current;
    if (!rider) return;

    const widthOf = () => rider.parentElement?.clientWidth || window.innerWidth;
    const carW = () => rider.offsetWidth || 112;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rider.style.transform = `translate3d(${Math.max(0, (widthOf() - carW()) / 2)}px,-50%,0)`;
      return;
    }

    let raf = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start == null) start = now;
      const p = ((now - start) % LOOP_MS) / LOOP_MS;
      const w = widthOf();
      const x = -carW() + p * (w + carW());
      rider.style.transform = `translate3d(${x}px,-50%,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[40] overflow-hidden"
      dir="ltr"
      aria-hidden
    >
      <div
        ref={riderRef}
        className="absolute top-1/2 h-9 w-[6.5rem] will-change-transform sm:h-10 sm:w-32 md:h-11 md:w-36"
      >
        <div ref={hostRef} className="h-full w-full" />
      </div>
    </div>
  );
}
