import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { getPublicSiteUrl } from "@/lib/public-site-url";
import { rateLimitModeForAdmin } from "@/lib/rate-limit";

/**
 * Authenticated summary of the running deployment (Vercel env vars when present).
 * Shown in admin footer after login.
 */
export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const site = getPublicSiteUrl();
  const vercelHost = process.env.VERCEL_URL?.trim();
  return NextResponse.json({
    vercelEnv: process.env.VERCEL_ENV ?? null,
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    vercelUrl: vercelHost ?? null,
    deploymentAbsoluteUrl: vercelHost ? `https://${vercelHost}` : null,
    rateLimit: rateLimitModeForAdmin(),
    cronOrderRemindersConfigured: Boolean(process.env.CRON_SECRET?.trim()),
    publicCookieBanner: { version: 1, mandatory: true, storageKey: "tp24_cookie_consent" },
    publicLegalPages: ["/privacy", "/terms"],
    seo: {
      publicSiteUrl: site,
      sitemapUrl: `${site}/sitemap.xml`,
      robotsUrl: `${site}/robots.txt`,
      googleSiteVerificationMeta: true,
    },
  });
}
