"use client";

import { useEffect, useRef, useState } from "react";

function canPlayVp9Webm() {
  if (typeof document === "undefined") return true;
  const v = document.createElement("video");
  return v.canPlayType('video/webm; codecs="vp9"') !== "";
}

/** Looping tap hint sitting above the Google-review CTA. */
export function OrderReviewTapHint({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [alphaVideo, setAlphaVideo] = useState(true);

  useEffect(() => {
    setAlphaVideo(canPlayVp9Webm());
    const el = videoRef.current;
    if (!el) return;
    el.loop = true;
    el.play().catch(() => {});
  }, []);

  return (
    <div className={`relative z-10 flex justify-center ${className ?? ""}`} aria-hidden>
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        className={`h-16 w-auto origin-bottom object-contain invert sm:h-[4.25rem] ${
          alphaVideo ? "drop-shadow-sm" : "mix-blend-multiply"
        }`}
      >
        <source src="/videos/order-review-tap.webm" type="video/webm" />
        <source src="/videos/order-review-tap.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
