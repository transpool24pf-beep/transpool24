"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readCookieConsentFromStorage,
  type CookieConsentPreferences,
} from "@/components/CookieConsentBarrier";

export function useMarketingConsent(): boolean {
  const [marketing, setMarketing] = useState(false);

  const sync = useCallback(() => {
    const stored = readCookieConsentFromStorage();
    setMarketing(Boolean(stored?.marketing));
  }, []);

  useEffect(() => {
    sync();
    const onConsent = (e: Event) => {
      const detail = (e as CustomEvent<CookieConsentPreferences>).detail;
      setMarketing(Boolean(detail?.marketing));
    };
    window.addEventListener("tp24:cookie-consent", onConsent);
    return () => window.removeEventListener("tp24:cookie-consent", onConsent);
  }, [sync]);

  return marketing;
}
