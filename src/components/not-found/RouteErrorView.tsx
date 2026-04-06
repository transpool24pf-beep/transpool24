"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { NotFoundLottie } from "./NotFoundLottie";

const COPY: Record<string, { h: string; p: string; retry: string; home: string }> = {
  ar: {
    h: "حدث خطأ",
    p: "تعذّر تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة للرئيسية.",
    retry: "إعادة المحاولة",
    home: "الرئيسية",
  },
  de: {
    h: "Etwas ist schiefgelaufen",
    p: "Die Seite konnte nicht geladen werden. Bitte erneut versuchen oder zur Startseite.",
    retry: "Erneut versuchen",
    home: "Zur Startseite",
  },
  ku: {
    h: "هەڵەیەک ڕوویدا",
    p: "بارکردنی پەڕەکە سەرکەوتوو نەبوو. دووبارە هەوڵ بدەرەوە یان بگەڕێوە بۆ سەرەتا.",
    retry: "دووبارە هەوڵ بدەرەوە",
    home: "سەرەتا",
  },
  default: {
    h: "Something went wrong",
    p: "We could not load this page. Try again or go back to the home page.",
    retry: "Try again",
    home: "Home",
  },
};

function localeFromPath(pathname: string | null): Locale {
  if (!pathname) return defaultLocale;
  const seg = pathname.split("/").filter(Boolean)[0];
  if (seg && (locales as readonly string[]).includes(seg)) return seg as Locale;
  return defaultLocale;
}

function messages(locale: Locale) {
  if (locale === "ar") return COPY.ar;
  if (locale === "de") return COPY.de;
  if (locale === "ku") return COPY.ku;
  return COPY.default;
}

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function RouteErrorView({ error, reset }: Props) {
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  const rtl = locale === "ar" || locale === "ku";
  const { h, p, retry, home } = messages(locale);

  const adminArea = pathname?.startsWith("/admin");
  const websiteArea = pathname?.startsWith("/website");
  const homeHref = adminArea ? "/admin/orders" : websiteArea ? "/website" : `/${locale}`;
  const homeLabel = adminArea
    ? locale === "de"
      ? "Zum Admin"
      : locale === "ar"
        ? "لوحة التحكم"
        : "Admin"
    : websiteArea
      ? locale === "de"
        ? "Zum Website-CMS"
        : "Website CMS"
      : home;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex min-h-[calc(100dvh-2rem)] flex-col items-center justify-center bg-[#f4f6f8] px-4 py-16"
      dir={rtl ? "rtl" : "ltr"}
    >
      <NotFoundLottie />
      <h1 className="mt-8 text-center text-2xl font-bold tracking-tight text-[#0d2137]">{h}</h1>
      <p className="mt-3 max-w-md text-center text-base text-[#0d2137]/72">{p}</p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-xl border-2 border-[#0d2137]/20 bg-white px-6 py-3.5 text-base font-semibold text-[#0d2137] transition hover:bg-[#0d2137]/5"
        >
          {retry}
        </button>
        <Link
          href={homeHref}
          className="inline-flex items-center rounded-xl bg-[var(--accent)] px-7 py-3.5 text-base font-semibold text-white shadow-md transition hover:brightness-105"
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
