"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const DOTLOTTIE_SRC =
  "https://lottie.host/14ce5ded-1c86-4a5b-b8da-fc48c838574f/qBwj0AUfBI.lottie";
const WC_SCRIPT = "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.3/dist/dotlottie-wc.js";

type Props = {
  /** Shown under the animation (e.g. “Calculating route…”). */
  label?: string;
  size?: "md" | "sm" | "lg";
  className?: string;
};

/**
 * Truck / route DotLottie via LottieFiles web component.
 * Loads the script once (Next dedupes by URL); mounts the player imperatively for React compatibility.
 */
export function OrderRouteLottie({ label, size = "md", className = "" }: Props) {
  const [scriptReady, setScriptReady] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const dim = size === "sm" ? 88 : size === "lg" ? 132 : 120;

  useEffect(() => {
    if (!scriptReady || !playerRef.current) return;
    const host = playerRef.current;
    host.replaceChildren();
    const el = document.createElement("dotlottie-wc");
    el.setAttribute("src", DOTLOTTIE_SRC);
    el.setAttribute("autoplay", "");
    el.setAttribute("loop", "");
    el.style.width = `${dim}px`;
    el.style.height = `${dim}px`;
    el.style.display = "block";
    host.appendChild(el);
    return () => {
      host.replaceChildren();
    };
  }, [scriptReady, dim]);

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <Script src={WC_SCRIPT} strategy="lazyOnload" type="module" onLoad={() => setScriptReady(true)} />
      <div className="relative" style={{ width: dim, height: dim }}>
        {!scriptReady && (
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
