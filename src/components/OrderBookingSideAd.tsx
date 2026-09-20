"use client";

import { useEffect, useState } from "react";
import { AdFrame } from "@/components/ads/AdFrame";
import { AdSenseUnit } from "@/components/ads/AdSenseUnit";

type Props = {
  slot: string;
  label: string;
  enabled: boolean;
};

/** In-column AdSense unit where the booking-page side trucks used to sit. */
export function OrderBookingSideAd({ slot, label, enabled }: Props) {
  if (!slot || !enabled) return null;
  return (
    <div className="sticky top-28 w-full max-w-[176px]">
      <AdFrame label={label} className="!p-1.5">
        <AdSenseUnit slot={slot} variant="sidebar" enabled={enabled} />
      </AdFrame>
    </div>
  );
}

/** Full-width horizontal unit for phones (do not CSS-hide a filled unit). */
export function OrderBookingBannerAd({ slot, label, enabled }: Props) {
  if (!slot || !enabled) return null;
  return (
    <div className="my-4 w-full">
      <AdFrame label={label}>
        <AdSenseUnit slot={slot} variant="banner" enabled={enabled} />
      </AdFrame>
    </div>
  );
}

/** `null` until measured so mobile and desktop ad slots are never mounted together. */
export function useIsDesktopLg(): boolean | null {
  const [isLg, setIsLg] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsLg(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return isLg;
}
