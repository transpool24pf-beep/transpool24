"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT } from "@/lib/adsense-config";

type Variant = "sidebar" | "banner";

const VARIANT_CLASS: Record<Variant, string> = {
  sidebar: "adsense-unit--sidebar min-h-[600px] w-full max-w-[160px]",
  banner: "adsense-unit--banner min-h-[90px] w-full max-w-[728px]",
};

type Props = {
  slot: string;
  variant: Variant;
  enabled: boolean;
};

export function AdSenseUnit({ slot, variant, enabled }: Props) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!enabled || !slot || pushed.current) return;
    if (!window.adsbygoogle) {
      window.adsbygoogle = [];
    }
    try {
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      /* Ad blockers */
    }
  }, [enabled, slot]);

  if (!slot) return null;

  return (
    <ins
      className={`adsbygoogle block overflow-hidden ${VARIANT_CLASS[variant]}`}
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
