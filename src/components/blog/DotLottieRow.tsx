"use client";

import { createElement, useEffect, useState } from "react";

const SCRIPT_SRC =
  "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.3/dist/dotlottie-wc.js";

let loadPromise: Promise<void> | null = null;

function loadDotLottieScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("dotlottie-wc")) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      const el = existing as HTMLScriptElement;
      if (el.dataset.loaded === "1") {
        resolve();
        return;
      }
      el.addEventListener("load", () => resolve(), { once: true });
      el.addEventListener("error", () => reject(new Error("dotlottie script")), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.type = "module";
    s.async = true;
    s.onload = () => {
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => reject(new Error("dotlottie script"));
    document.head.appendChild(s);
  });

  return loadPromise;
}

function DotLottieOne({ src }: { src: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadDotLottieScript()
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

  if (!ready) {
    return (
      <div
        className="mx-auto rounded-2xl bg-gradient-to-br from-[#eef0f3] to-[#e85d04]/[0.08] ring-1 ring-black/[0.06]"
        style={{ width: 280, height: 280 }}
        aria-hidden
      />
    );
  }

  return createElement("dotlottie-wc", {
    src,
    style: { width: "280px", height: "280px", maxWidth: "100%" },
    autoplay: true,
    loop: true,
  });
}

type Props = {
  primarySrc: string;
  secondarySrc: string;
};

export function DotLottieRow({ primarySrc, secondarySrc }: Props) {
  return (
    <div
      className="my-12 grid grid-cols-1 gap-8 rounded-[1.35rem] bg-gradient-to-br from-[#0d2137]/[0.04] via-white to-[#e85d04]/[0.07] p-6 ring-1 ring-black/[0.06] sm:grid-cols-2 sm:p-8"
      dir="ltr"
    >
      <div className="flex items-center justify-center">
        <DotLottieOne src={primarySrc} />
      </div>
      <div className="flex items-center justify-center">
        <DotLottieOne src={secondarySrc} />
      </div>
    </div>
  );
}
