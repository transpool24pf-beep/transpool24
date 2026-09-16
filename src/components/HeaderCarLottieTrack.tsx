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
        svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
        svg.style.display = "block";
        svg.style.width = "100%";
        svg.style.height = "100%";
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
    /** Sit 2px onto the 2px border so wheels rest on the road line. */
    const roadY = 2;

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
        className="absolute bottom-0 h-10 w-[7.25rem] will-change-transform sm:h-11 sm:w-32 md:h-12 md:w-40"
      >
        <div ref={hostRef} className="h-full w-full" />
      </div>
    </div>
  );
}
