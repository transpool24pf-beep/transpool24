"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { NotFoundLottie } from "./NotFoundLottie";

const COPY: Record<string, { h: string; p: string; home: string }> = {
  ar: {
    h: "الصفحة غير موجودة",
    p: "الرابط غير صحيح أو المحتوى لم يعد متوفراً.",
    home: "الرئيسية",
  },
  de: {
    h: "Seite nicht gefunden",
    p: "Diese Adresse existiert nicht oder wurde verschoben.",
    home: "Zur Startseite",
  },
  ku: {
    h: "پەڕە نەدۆزرایەوە",
    p: "لینکەکە هەڵە یان پەڕەکە چیتر بەردەست نییە.",
    home: "سەرەتا",
  },
  default: {
    h: "Page not found",
    p: "This link may be wrong or the page is no longer available.",
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

export function NotFoundView() {
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  const rtl = locale === "ar" || locale === "ku";
  const { h, p, home } = messages(locale);

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

  return (
    <div
      className="flex min-h-[calc(100dvh-2rem)] flex-col items-center justify-center bg-[#f4f6f8] px-4 py-16"
      dir={rtl ? "rtl" : "ltr"}
    >
      <NotFoundLottie />
      <h1 className="mt-8 text-center text-2xl font-bold tracking-tight text-[#0d2137]">{h}</h1>
      <p className="mt-3 max-w-md text-center text-base text-[#0d2137]/72">{p}</p>
      <Link
        href={homeHref}
        className="mt-10 inline-flex items-center rounded-xl bg-[var(--accent)] px-7 py-3.5 text-base font-semibold text-white shadow-md transition hover:brightness-105"
      >
        {homeLabel}
      </Link>
    </div>
  );
}
