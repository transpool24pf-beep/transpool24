"use client";

import { useEffect, useRef } from "react";

/** Small looping tap hint for the Google-review button. */
export function OrderReviewTapHint({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.loop = true;
    el.play().catch(() => {});
  }, []);

  return (
    <div className={`flex justify-center ${className ?? ""}`} aria-hidden>
      <video
        ref={videoRef}
        src="/videos/order-review-tap.mp4"
        poster="/images/order-review-tap.png"
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        className="pointer-events-none h-12 w-auto origin-bottom invert mix-blend-multiply sm:h-[3.25rem]"
      />
    </div>
  );
}
