import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/public-site-url";

const SITE = getPublicSiteUrl();

/**
 * SEO focus URLs requested for indexing priority.
 * Keep this list tight to reduce crawl budget dilution.
 */
const SEO_FOCUS_PATHS = [
  "/ar",
  "/ar/driver",
  "/ar/privacy",
  "/ar/support",
  "/ar/terms",
  "/de",
  "/de/driver",
  "/de/support",
  "/de/terms",
  "/de/why",
  "/en/driver",
  "/en/support",
  "/en/terms",
  "/es/blog",
  "/es/driver",
  "/es/privacy",
  "/es/support",
  "/es/terms",
  "/fr",
  "/fr/blog",
  "/fr/driver",
  "/fr/privacy",
  "/fr/support",
  "/fr/terms",
  "/fr/why",
  "/it",
  "/it/blog",
  "/it/driver",
  "/it/privacy",
  "/it/support",
  "/it/terms",
  "/it/why",
  "/ku",
  "/ku/driver",
  "/ku/privacy",
  "/ku/support",
  "/ku/terms",
  "/ku/why",
  "/pl",
  "/pl/blog",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return SEO_FOCUS_PATHS.map((path) => ({
    url: `${SITE}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: path === "/de" || path === "/ar" ? 1 : 0.9,
  }));
}
