"use client";

import { useEffect, useState } from "react";

const SCRIPT_SRC = "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.3/dist/dotlottie-wc.js";
const SCRIPT_ID = "dotlottie-wc-esm";

const SRC_MAIN = "https://lottie.host/dd974616-614f-44ab-a00b-4e716c5f973e/X1KNGVU32P.lottie";
const SRC_SECONDARY = "https://lottie.host/1d06f285-7426-4d7c-a4d4-2562e1d47d63/8Zl8gLt6HY.lottie";

/** inline = under title on normal order page; fullscreen = maintenance hero (larger, centered). */
export function OrderIntroDotLotties({ layout = "inline" }: { layout?: "inline" | "fullscreen" }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      setReady(true);
      return;
    }
    let done = false;
    const mark = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.type = "module";
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => mark();
    s.onerror = () => mark();
    document.body.appendChild(s);
    const fallback = window.setTimeout(mark, 1600);
    return () => {
      window.clearTimeout(fallback);
    };
  }, []);

  const isFull = layout === "fullscreen";

  const mainStyle = isFull
    ? { width: "min(92vw, 520px)", height: "min(70vh, 520px)" }
    : { width: 300, height: 300 };
  const secondStyle = isFull
    ? { width: "min(52vw, 260px)", height: "min(28vh, 260px)" }
    : { width: 140, height: 140 };

  return (
    <div
      className={
        isFull
          ? "flex w-full max-w-3xl flex-col items-center justify-center gap-3 py-4 sm:gap-5 sm:py-8"
          : "mb-6 flex flex-col items-center gap-1"
      }
    >
      {ready ? (
        <>
          <dotlottie-wc src={SRC_MAIN} style={mainStyle} autoplay loop />
          <dotlottie-wc src={SRC_SECONDARY} style={secondStyle} autoplay loop />
        </>
      ) : (
        <>
          <div
            className={`animate-pulse rounded-2xl bg-[#0d2137]/5 ${isFull ? "min-h-[min(70vh,480px)] w-[min(92vw,520px)]" : "h-[300px] w-[300px]"}`}
            aria-hidden
          />
          <div
            className={`animate-pulse rounded-xl bg-[#0d2137]/5 ${isFull ? "h-[min(28vh,220px)] w-[min(55vw,260px)]" : "h-[140px] w-[140px]"}`}
            aria-hidden
          />
        </>
      )}
    </div>
  );
}
