"use client";

import { useEffect, useRef } from "react";
import {
  ADSENSE_CLIENT,
  ADSENSE_SIDEBAR_HEIGHT,
  ADSENSE_SIDEBAR_WIDTH,
} from "@/lib/adsense-config";

type Variant = "sidebar" | "banner" | "compact";

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

  if (variant === "sidebar") {
    return (
      <ins
        className="adsbygoogle block overflow-hidden"
        style={{
          display: "inline-block",
          width: ADSENSE_SIDEBAR_WIDTH,
          height: ADSENSE_SIDEBAR_HEIGHT,
          maxHeight: ADSENSE_SIDEBAR_HEIGHT,
        }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
      />
    );
  }

  if (variant === "compact") {
    return (
      <ins
        className="adsbygoogle adsense-unit--compact block w-full overflow-hidden"
        style={{
          display: "block",
          width: "100%",
          height: 90,
          maxHeight: 90,
        }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="horizontal"
        data-full-width-responsive="false"
      />
    );
  }

  return (
    <ins
      className="adsbygoogle adsense-unit--banner block w-full overflow-hidden"
      style={{ display: "block", minHeight: 100, width: "100%" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}
