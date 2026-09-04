"use client";

import { useEffect } from "react";
import {
  ADSENSE_SIDEBAR_HEIGHT,
  ADSENSE_SIDEBAR_WIDTH,
} from "@/lib/adsense-config";
import { AdFrame } from "@/components/ads/AdFrame";
import { AdSenseUnit } from "@/components/ads/AdSenseUnit";

type Side = "left" | "right";

type Props = {
  side: Side;
  slot: string;
  label: string;
  enabled: boolean;
};

/** Fixed-size skyscraper; stays visible while scrolling (viewport-fixed). */
export function AdSidebarRail({ side, slot, label, enabled }: Props) {
  const sideClass = side === "left" ? "left-3" : "right-3";

  return (
    <aside
      className={`pointer-events-auto fixed top-[6.75rem] z-30 hidden min-[1280px]:block ${sideClass}`}
      style={{ width: ADSENSE_SIDEBAR_WIDTH + 16 }}
      data-tp24-ad-region={`sidebar-${side}`}
    >
      <AdFrame label={label} className="!p-1.5">
        <AdSenseUnit slot={slot} variant="sidebar" enabled={enabled} />
      </AdFrame>
    </aside>
  );
}

/** Reserve horizontal gutter on wide screens so rails sit beside content, not on top of it. */
export function AdRailPageGutter({ active }: { active: boolean }) {
  useEffect(() => {
    const root = document.documentElement;
    if (active) {
      root.classList.add("tp24-ad-rails-active");
      root.style.setProperty("--tp24-ad-gutter", `${ADSENSE_SIDEBAR_WIDTH + 24}px`);
    } else {
      root.classList.remove("tp24-ad-rails-active");
      root.style.removeProperty("--tp24-ad-gutter");
    }
    return () => {
      root.classList.remove("tp24-ad-rails-active");
      root.style.removeProperty("--tp24-ad-gutter");
    };
  }, [active]);

  return null;
}

export { ADSENSE_SIDEBAR_WIDTH, ADSENSE_SIDEBAR_HEIGHT };
