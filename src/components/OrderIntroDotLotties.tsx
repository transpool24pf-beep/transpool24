"use client";

import { useEffect, useState } from "react";

const SCRIPT_SRC = "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.3/dist/dotlottie-wc.js";
const SCRIPT_ID = "dotlottie-wc-esm";

const SRC_MAIN = "https://lottie.host/dd974616-614f-44ab-a00b-4e716c5f973e/X1KNGVU32P.lottie";
const SRC_SECONDARY = "https://lottie.host/1d06f285-7426-4d7c-a4d4-2562e1d47d63/8Zl8gLt6HY.lottie";

export function OrderIntroDotLotties() {
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

  return (
    <div className="mb-6 flex flex-col items-center gap-1">
      {ready ? (
        <>
          <dotlottie-wc src={SRC_MAIN} style={{ width: 300, height: 300 }} autoplay loop />
          <dotlottie-wc src={SRC_SECONDARY} style={{ width: 140, height: 140 }} autoplay loop />
        </>
      ) : (
        <>
          <div className="h-[300px] w-[300px] animate-pulse rounded-2xl bg-[#0d2137]/5" aria-hidden />
          <div className="h-[140px] w-[140px] animate-pulse rounded-xl bg-[#0d2137]/5" aria-hidden />
        </>
      )}
    </div>
  );
}
