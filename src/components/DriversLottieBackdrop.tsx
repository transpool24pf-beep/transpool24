"use client";

import { createElement, useEffect, useState } from "react";

const DOTLOTTIE_SCRIPT = "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.3/dist/dotlottie-wc.js";
const LOTTIE_SRC =
  "https://lottie.host/828d5b20-c26c-4bed-a653-123080a0cadd/3PyaPWb0Uq.lottie";

declare global {
  interface Window {
    __dotlottieWcPromise?: Promise<void>;
  }
}

/** Fixed “random” layout — stable across SSR/hydration. */
const PLACEMENTS = [
  { topPct: 5, leftPct: 3, size: 210, opacity: 0.34, rot: -14, drift: "a" as const },
  { topPct: 52, leftPct: -4, size: 125, opacity: 0.24, rot: 22, drift: "b" as const },
  { topPct: 12, leftPct: 72, size: 260, opacity: 0.3, rot: 8, drift: "b" as const },
  { topPct: 68, leftPct: 58, size: 175, opacity: 0.38, rot: -18, drift: "a" as const },
  { topPct: 38, leftPct: 10, size: 95, opacity: 0.2, rot: 0, drift: "a" as const },
  { topPct: 2, leftPct: 40, size: 155, opacity: 0.27, rot: -22, drift: "b" as const },
  { topPct: 48, leftPct: 86, size: 195, opacity: 0.32, rot: 12, drift: "a" as const },
  { topPct: 78, leftPct: 28, size: 140, opacity: 0.29, rot: -6, drift: "b" as const },
  { topPct: 22, leftPct: 48, size: 110, opacity: 0.22, rot: 16, drift: "b" as const },
];

function loadDotlottieScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.__dotlottieWcPromise) return window.__dotlottieWcPromise;

  window.__dotlottieWcPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${DOTLOTTIE_SCRIPT}"]`);
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = DOTLOTTIE_SCRIPT;
    s.type = "module";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("dotlottie-wc load failed"));
    document.head.appendChild(s);
  });

  return window.__dotlottieWcPromise;
}

/**
 * Multiple looping Lottie instances behind the drivers carousel (web component).
 */
export function DriversLottieBackdrop() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadDotlottieScript()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {PLACEMENTS.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: `${p.topPct}%`,
            left: `${p.leftPct}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
        >
          <div
            className="h-full w-full"
            style={{ transform: `rotate(${p.rot}deg)` }}
          >
            <div
              className={`h-full w-full ${p.drift === "a" ? "drivers-lottie-drift-a" : "drivers-lottie-drift-b"}`}
            >
              {createElement("dotlottie-wc", {
                src: LOTTIE_SRC,
                autoplay: true,
                loop: true,
                style: { width: "100%", height: "100%", display: "block" },
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
