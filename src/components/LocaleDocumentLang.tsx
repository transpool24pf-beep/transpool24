"use client";

import { useEffect } from "react";
import { localeToHtmlLang } from "@/lib/locale-html-lang";

/**
 * Syncs <html lang> with the URL locale so native widgets and assistive tech
 * follow the site language instead of only the OS/browser UI language.
 */
export function LocaleDocumentLang({ locale }: { locale: string }) {
  useEffect(() => {
    const tag = localeToHtmlLang(locale);
    const el = document.documentElement;
    const prev = el.getAttribute("lang");
    el.lang = tag;
    return () => {
      if (prev != null) el.setAttribute("lang", prev);
      else el.lang = "de";
    };
  }, [locale]);

  return null;
}
