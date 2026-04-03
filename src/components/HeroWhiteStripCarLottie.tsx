"use client";

import { useEffect, useState } from "react";
import { ensureDotlottieScript, HERO_STRIP_CAR_LOTTIE_SRC } from "@/lib/dotlottie-wc-script";

/**
 * Car runs along the full width of the white strip at the bottom of the hero.
 * Strip sits under headline/CTA; header stays solid with no animation underneath.
 */
export function HeroWhiteStripCarLottie() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ensureDotlottieScript()
      .then(() => customElements.whenDefined("dotlottie-wc"))
      .then(() => {
        if (!cancelled) setShow(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="hero-strip-car-layer pointer-events-none absolute inset-0 overflow-hidden"
      dir="ltr"
      aria-hidden
    >
      {show ? (
        <div className="hero-strip-car-rider">
          <div className="hero-strip-car-inner">
            <dotlottie-wc
              src={HERO_STRIP_CAR_LOTTIE_SRC}
              autoplay
              loop
              style={{ width: 300, height: 300, display: "block" }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
