"use client";

import React, { useEffect, useState } from "react";

const SCRIPT_SRC = "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.8/dist/dotlottie-wc.js";
const LOTTIE_SRC =
  "https://lottie.host/20a79736-10a5-43b2-a1da-e23746342cc9/eq5LqR9vmA.lottie";

/**
 * Loads dotlottie-wc (module) once and renders the 404 / error Lottie per product spec.
 */
export function NotFoundLottie() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!document.querySelector('script[data-tp-dotlottie="1"]')) {
        await new Promise<void>((resolve) => {
          const s = document.createElement("script");
          s.src = SCRIPT_SRC;
          s.type = "module";
          s.async = true;
          s.dataset.tpDotlottie = "1";
          s.onload = () => resolve();
          s.onerror = () => resolve();
          document.body.appendChild(s);
        });
      }

      try {
        await Promise.race([
          customElements.whenDefined("dotlottie-wc"),
          new Promise<void>((r) => setTimeout(r, 4000)),
        ]);
      } catch {
        /* ignore */
      }
      if (!cancelled) setReady(true);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div
        className="mx-auto h-[300px] w-[300px] animate-pulse rounded-2xl bg-[#0d2137]/10"
        aria-busy="true"
        aria-label="Loading animation"
      />
    );
  }

  return (
    <div className="flex justify-center">
      {React.createElement("dotlottie-wc", {
        src: LOTTIE_SRC,
        style: { width: 300, height: 300 },
        autoplay: true,
        loop: true,
      })}
    </div>
  );
}
