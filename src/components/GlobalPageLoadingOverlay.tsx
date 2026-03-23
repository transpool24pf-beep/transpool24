"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DOTLOTTIE_PAGE_LOADING_BLUE, DOTLOTTIE_WC_SCRIPT } from "@/lib/dotlottie-assets";

const NAV_SHOW_DELAY_MS = 420;
const INITIAL_SHOW_DELAY_MS = 900;

function isModifiedNavigationClick(e: MouseEvent) {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

export function GlobalPageLoadingOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  const [visible, setVisible] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [dim, setDim] = useState(300);
  const hostRef = useRef<HTMLDivElement>(null);

  const pendingNavRef = useRef(false);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1024;
    setDim(Math.min(300, Math.round(w * 0.78)));
  }, []);

  useEffect(() => {
    pendingNavRef.current = false;
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    setVisible(false);
  }, [routeKey]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const onPointerDown = (e: MouseEvent) => {
      if (isModifiedNavigationClick(e)) return;
      const el = (e.target as HTMLElement | null)?.closest("a");
      if (!el || !(el instanceof HTMLAnchorElement)) return;
      if (el.target && el.target !== "" && el.target !== "_self") return;
      if (el.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(el.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      const next = `${url.pathname}${url.search}`;
      const cur = `${window.location.pathname}${window.location.search}`;
      if (next === cur) return;

      pendingNavRef.current = true;
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      delayTimerRef.current = setTimeout(() => {
        delayTimerRef.current = null;
        if (pendingNavRef.current) setVisible(true);
      }, NAV_SHOW_DELAY_MS);
    };

    document.addEventListener("click", onPointerDown, true);
    return () => document.removeEventListener("click", onPointerDown, true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (document.readyState === "complete") return;

    initialTimerRef.current = setTimeout(() => {
      initialTimerRef.current = null;
      if (document.readyState !== "complete") setVisible(true);
    }, INITIAL_SHOW_DELAY_MS);

    const onLoad = () => {
      if (initialTimerRef.current) {
        clearTimeout(initialTimerRef.current);
        initialTimerRef.current = null;
      }
      setVisible(false);
    };
    window.addEventListener("load", onLoad);
    return () => {
      if (initialTimerRef.current) clearTimeout(initialTimerRef.current);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!visible) {
      setPlayerReady(false);
      return;
    }

    const markReady = () => setPlayerReady(true);
    if (customElements.get("dotlottie-wc")) {
      markReady();
      return;
    }
    let cancelled = false;
    customElements.whenDefined("dotlottie-wc").then(() => {
      if (!cancelled) markReady();
    });
    const fallback = window.setTimeout(() => {
      if (!cancelled && customElements.get("dotlottie-wc")) markReady();
    }, 12_000);
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || !playerReady || !hostRef.current) return;
    const host = hostRef.current;
    host.replaceChildren();
    const el = document.createElement("dotlottie-wc");
    el.setAttribute("src", DOTLOTTIE_PAGE_LOADING_BLUE);
    el.setAttribute("autoplay", "");
    el.setAttribute("loop", "");
    el.style.width = `${dim}px`;
    el.style.height = `${dim}px`;
    el.style.display = "block";
    host.appendChild(el);
    return () => {
      host.replaceChildren();
    };
  }, [visible, playerReady, dim]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center bg-white/88 backdrop-blur-[3px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <Script src={DOTLOTTIE_WC_SCRIPT} strategy="afterInteractive" type="module" />
      <div className="relative flex flex-col items-center gap-3">
        <div className="relative" style={{ width: dim, height: dim }}>
          {!playerReady && (
            <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
              <span
                className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)]/25 border-t-[var(--accent)]"
                aria-hidden
              />
            </div>
          )}
          <div ref={hostRef} className="relative z-[1]" style={{ width: dim, height: dim }} />
        </div>
        <span className="sr-only">Loading page</span>
      </div>
    </div>
  );
}
