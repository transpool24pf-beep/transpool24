import type { MetadataRoute } from "next";
import { defaultLocale, locales } from "@/i18n/routing";
import { getPublicSiteUrl } from "@/lib/public-site-url";

const SITE = getPublicSiteUrl();

/** مسارات عامة لكل لغة (بدون صفحات ديناميكية للمدونة لتفادي روابط قديمة). */
const PUBLIC_PATHS = ["", "/order", "/why", "/support", "/privacy", "/terms", "/driver", "/blog"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_PATHS.flatMap((path) =>
    locales.map((loc) => {
      const url = `${SITE}/${loc}${path}`;
      const languages: Record<string, string> = {
        "x-default": `${SITE}/${defaultLocale}${path}`,
      };
      for (const l of locales) {
        languages[l] = `${SITE}/${l}${path}`;
      }
      return {
        url,
        lastModified,
        changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
        priority: path === "" ? 1 : 0.75,
        alternates: { languages },
      };
    }),
  );
}
