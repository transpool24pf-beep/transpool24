"use client";

import { OrderRouteLottie } from "@/components/OrderRouteLottie";
import { DOTLOTTIE_ORDER_SIDE_TRUCK } from "@/lib/dotlottie-assets";

type Props = {
  /** Opposite horizontal drift vs the other column. */
  variant: "a" | "b";
};

/**
 * Decorative isometric truck beside the order form (desktop). Drifts left↔right in opposite phase per side.
 */
export function OrderBookingSideLottie({ variant }: Props) {
  const drift = variant === "a" ? "order-lottie-drift-a" : "order-lottie-drift-b";
  const mirror = variant === "b";
  return (
    <div
      className={`pointer-events-none flex select-none justify-center ${drift}`}
      aria-hidden
    >
      <div
        className={`rounded-2xl border border-[#0d2137]/8 bg-white/60 p-3 shadow-sm backdrop-blur-[2px] ${mirror ? "scale-x-[-1]" : ""}`}
      >
        <OrderRouteLottie
          src={DOTLOTTIE_ORDER_SIDE_TRUCK}
          size="xl"
          className="[&_p]:hidden"
        />
      </div>
    </div>
  );
}
