"use client";

import { useEffect, useState } from "react";

const SCRIPT_SRC = "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.10/dist/dotlottie-wc.js";
const LOTTIE_SRC =
  "https://lottie.host/7cfe2424-ad66-4ffc-b5ad-ca19d0e350a0/Cnfq4FzaWh.lottie";

let scriptPromise: Promise<void> | null = null;

function ensureDotlottieScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("dotlottie-wc")) return Promise.resolve();
  const existing = document.querySelector("script[data-tp-dotlottie-wc]");
  if (existing) {
    return new Promise((resolve, reject) => {
      if (customElements.get("dotlottie-wc")) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("dotlottie-wc load error")), { once: true });
    });
  }
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.type = "module";
      s.src = SCRIPT_SRC;
      s.dataset.tpDotlottieWc = "";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("dotlottie-wc script failed"));
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

/** Decorative car: crosses header right → left (physical), behind toolbar content. */
export function HeaderCarLottieBackground() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ensureDotlottieScript()
      .then(() => customElements.whenDefined("dotlottie-wc"))
      .then(() => {
        if (!cancelled) setShow(true);
      })
      .catch(() => {
        /* optional asset; fail silently */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="header-car-lottie-layer pointer-events-none absolute inset-0 z-0 overflow-hidden"
      dir="ltr"
      aria-hidden
    >
      {show ? (
        <div className="header-car-lottie-rider">
          <div className="header-car-lottie-inner">
            <dotlottie-wc
              src={LOTTIE_SRC}
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
