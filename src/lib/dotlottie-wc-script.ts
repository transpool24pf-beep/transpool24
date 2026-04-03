/** Shared loader for @lottiefiles/dotlottie-wc (single script tag per page). */

export const DOTLOTTIE_WC_SCRIPT_SRC =
  "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.10/dist/dotlottie-wc.js";

export const HEADER_CAR_LOTTIE_SRC =
  "https://lottie.host/7cfe2424-ad66-4ffc-b5ad-ca19d0e350a0/Cnfq4FzaWh.lottie";

let scriptPromise: Promise<void> | null = null;

export function ensureDotlottieScript(): Promise<void> {
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
      s.src = DOTLOTTIE_WC_SCRIPT_SRC;
      s.dataset.tpDotlottieWc = "";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("dotlottie-wc script failed"));
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}
