"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { DOTLOTTIE_ROUTE_PIN, DOTLOTTIE_WC_SCRIPT } from "@/lib/dotlottie-assets";

type Props = {
  /** DotLottie file URL (default: route pin animation). */
  src?: string;
  /** Shown under the animation (e.g. “Calculating route…”). */
  label?: string;
  size?: "md" | "sm" | "lg" | "xl";
  /** When set, overrides `size` pixel width/height. */
  dimension?: number;
  /** Mirror horizontally (reliable for `dotlottie-wc` vs CSS on a distant ancestor). */
  flipHorizontal?: boolean;
  className?: string;
};

/**
 * DotLottie via LottieFiles web component.
 * Uses customElements.whenDefined so every instance becomes ready (Next may dedupe Script; onLoad is not guaranteed per instance).
 */
export function OrderRouteLottie({
  src = DOTLOTTIE_ROUTE_PIN,
  label,
  size = "md",
  dimension: dimensionProp,
  flipHorizontal = false,
  className = "",
}: Props) {
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const dim =
    dimensionProp ??
    (size === "sm" ? 88 : size === "lg" ? 132 : size === "xl" ? 220 : 120);

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

  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    const host = playerRef.current;
    host.replaceChildren();
    const el = document.createElement("dotlottie-wc");
    el.setAttribute("src", src);
    el.setAttribute("autoplay", "");
    el.setAttribute("loop", "");
    el.style.width = `${dim}px`;
    el.style.height = `${dim}px`;
    el.style.display = "block";
    host.appendChild(el);
    return () => {
      host.replaceChildren();
    };
  }, [playerReady, dim, src]);

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <Script src={DOTLOTTIE_WC_SCRIPT} strategy="afterInteractive" type="module" />
      <div
        className="relative"
        style={{
          width: dim,
          height: dim,
          ...(flipHorizontal
            ? { transform: "scaleX(-1)", transformOrigin: "center center" }
            : {}),
        }}
      >
        {!playerReady && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span
              className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--accent)]/25 border-t-[var(--accent)]"
              aria-hidden
            />
          </div>
        )}
        <div ref={playerRef} className="relative z-[1]" style={{ width: dim, height: dim }} />
      </div>
      {label ? (
        <p className="max-w-[16rem] text-center text-sm font-medium text-[var(--foreground)]/75">{label}</p>
      ) : null}
    </div>
  );
}
