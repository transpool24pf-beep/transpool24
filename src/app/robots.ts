import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/public-site-url";

const SITE = getPublicSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/website/"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
