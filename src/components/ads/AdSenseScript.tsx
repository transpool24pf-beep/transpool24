"use client";

import { useEffect } from "react";
import { ADSENSE_CLIENT } from "@/lib/adsense-config";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = { enabled: boolean };

/** Loads AdSense JS once, after marketing cookie consent (no Auto ads injection from layout). */
export function AdSenseScript({ enabled }: Props) {
  useEffect(() => {
    if (!enabled) return;
    if (document.querySelector('script[data-tp24-adsense="1"]')) return;

    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-tp24-adsense", "1");
    document.head.appendChild(script);
  }, [enabled]);

  return null;
}
