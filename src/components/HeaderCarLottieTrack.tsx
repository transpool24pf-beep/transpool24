"use client";

import { useEffect, useRef } from "react";

const HEADER_VAN_JSON = "/lottie/header-van.json";
const LOOP_MS = 18000;

/**
 * Same header van as desktop, drawn with lottie-web SVG (works on iOS).
 * Travels along the bar behind the toolbar (under the buttons, not over them).
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
      rider.style.transform = `translate3d(${Math.max(0, (widthOf() - carW()) / 2)}px,0,0)`;
      return;
    }

    let raf = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start == null) start = now;
      const p = ((now - start) % LOOP_MS) / LOOP_MS;
      const w = widthOf();
      const x = -carW() + p * (w + carW());
      rider.style.transform = `translate3d(${x}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      dir="ltr"
      aria-hidden
    >
      <div
        ref={riderRef}
        className="absolute bottom-0 h-7 w-[5.5rem] will-change-transform sm:h-8 sm:w-24 md:h-10 md:w-32"
      >
        <div ref={hostRef} className="h-full w-full" />
      </div>
    </div>
  );
}
