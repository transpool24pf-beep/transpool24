"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/videos/order-success-handshake.mp4";
const POSTER_SRC = "/images/order-success-handshake.png";

export function OrderSuccessHandshake({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
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

  return (
    <div className={`flex justify-center ${className ?? ""}`}>
      <div className="relative isolate">
        <div
          className="pointer-events-none absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(232,93,4,0.28)_0%,rgba(34,197,94,0.12)_45%,transparent_70%)] blur-md"
          aria-hidden
        />
        <div
          className={`relative h-[8.5rem] w-[8.5rem] transition duration-700 ease-out sm:h-40 sm:w-40 ${
            entered ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
        >
          <div
            className="pointer-events-none absolute inset-0 animate-[ping_1.8s_ease-out_1] rounded-full bg-[var(--accent)]/20"
            aria-hidden
          />
          <div className="relative h-full w-full overflow-hidden rounded-full bg-[#08111c] shadow-[0_12px_40px_-8px_rgba(13,33,55,0.55)] ring-[3px] ring-white ring-offset-2 ring-offset-green-50">
            {reduceMotion ? (
              <Image src={POSTER_SRC} alt="" fill sizes="160px" className="object-cover" />
            ) : (
              <video
                ref={videoRef}
                src={VIDEO_SRC}
                poster={POSTER_SRC}
                muted
                playsInline
                autoPlay
                loop
                preload="auto"
                className="h-full w-full origin-center scale-[1.06] object-cover"
                aria-hidden
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
