"use client";

import { useEffect, useRef } from "react";
import {
  ensureDotlottieScript,
  HEADER_CAR_LOTTIE_SRC,
  waitForDotlottieWcRegistered,
} from "@/lib/dotlottie-wc-script";

/**
 * Car crosses the header bar left → right (physical), under semi-transparent toolbar.
 * Imperative <dotlottie-wc> — React may not upgrade custom elements from JSX reliably.
 */
export function HeaderCarLottieTrack() {
  const mountRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      className="header-bar-car-layer pointer-events-none absolute inset-0 z-0 overflow-hidden"
      dir="ltr"
      aria-hidden
    >
      <div className="header-bar-car-rider">
        <div className="header-bar-car-inner" ref={mountRef} />
      </div>
    </div>
  );
}
