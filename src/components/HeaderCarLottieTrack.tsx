"use client";

import { useEffect, useState } from "react";
import { ensureDotlottieScript, HEADER_CAR_LOTTIE_SRC } from "@/lib/dotlottie-wc-script";

/**
 * Car crosses the header bar left → right (physical), under semi-transparent toolbar.
 */
export function HeaderCarLottieTrack() {
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
      className="header-bar-car-layer pointer-events-none absolute inset-0 z-0 overflow-hidden"
      dir="ltr"
      aria-hidden
    >
      {show ? (
        <div className="header-bar-car-rider">
          <div className="header-bar-car-inner">
            <dotlottie-wc
              src={HEADER_CAR_LOTTIE_SRC}
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
