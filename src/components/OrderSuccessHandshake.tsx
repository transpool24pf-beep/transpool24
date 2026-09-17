"use client";

import { useEffect, useRef, useState } from "react";

function canPlayVp9Webm() {
  if (typeof document === "undefined") return true;
  const v = document.createElement("video");
  return v.canPlayType('video/webm; codecs="vp9"') !== "";
}

export function OrderSuccessHandshake({
  className,
  webmSrc = "/videos/order-success-handshake.webm",
  mp4Src = "/videos/order-success-handshake.mp4",
}: {
  className?: string;
  webmSrc?: string;
  mp4Src?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [alphaVideo, setAlphaVideo] = useState(true);

  useEffect(() => {
    setAlphaVideo(canPlayVp9Webm());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const el = videoRef.current;
    if (!el) return;
    el.loop = true;
    el.play().catch(() => {});
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <div className={`flex justify-center ${className ?? ""}`} aria-hidden>
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        className={`h-36 w-36 object-contain sm:h-40 sm:w-40 ${alphaVideo ? "" : "mix-blend-screen"}`}
      >
        <source src={webmSrc} type="video/webm" />
        <source src={mp4Src} type="video/mp4" />
      </video>
    </div>
  );
}
