"use client";

import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";

const HEADER_VAN_JSON = "/lottie/header-van.json";
const LOOP_MS = 18000;

/**
 * Van drives left → right on the header bottom border (the bar line = the road).
 * Behind the buttons. lottie-web SVG so it also runs on iOS.
 */
export function HeaderCarLottieTrack() {
  const hostRef = useRef<HTMLDivElement>(null);
  const riderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let anim: AnimationItem | null = null;
    let cancelled = false;

    (async () => {
      const lottie = (await import("lottie-web")).default;
      if (cancelled || !hostRef.current) return;
      host.innerHTML = "";
      const loaded = lottie.loadAnimation({
        container: host,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: HEADER_VAN_JSON,
        rendererSettings: {
          // Pin wheels to the bottom of the box = the header border / road
          preserveAspectRatio: "xMidYMax meet",
        },
      });
      anim = loaded;
      loaded.addEventListener("DOMLoaded", () => {
        const svg = host.querySelector("svg");
        if (!svg) return;
        // Crop empty sky/ground in the 1920×1080 comp so wheels sit on the road line
        svg.setAttribute("viewBox", "40 210 1840 620");
        svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
        svg.style.display = "block";
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.overflow = "visible";
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
    const carW = () => rider.offsetWidth || 128;
    const roadY = 1;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rider.style.transform = `translate3d(${Math.max(0, (widthOf() - carW()) / 2)}px,${roadY}px,0)`;
      return;
    }

    let raf = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start == null) start = now;
      const p = ((now - start) % LOOP_MS) / LOOP_MS;
      const w = widthOf();
      const x = -carW() + p * (w + carW());
      rider.style.transform = `translate3d(${x}px,${roadY}px,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 top-0 z-0 overflow-visible"
      dir="ltr"
      aria-hidden
    >
      <div
        ref={riderRef}
        className="absolute bottom-px h-8 w-[6.75rem] will-change-transform sm:h-9 sm:w-[7.75rem] md:h-9 md:w-32"
      >
        <div ref={hostRef} className="h-full w-full" />
      </div>
    </div>
  );
}
