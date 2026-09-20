"use client";

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
