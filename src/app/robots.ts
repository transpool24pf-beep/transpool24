import type { MetadataRoute } from "next";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com").replace(
  /\/$/,
  "",
);

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
