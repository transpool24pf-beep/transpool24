import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

function supabaseHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
const supabaseHost = supabaseHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      { protocol: "https", hostname: "ui-avatars.com", pathname: "/api/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "media.istockphoto.com", pathname: "/id/**" },
      { protocol: "https", hostname: "channel.mediacdn.vn", pathname: "/**" },
      { protocol: "https", hostname: "adex.tn", pathname: "/content/uploads/**" },
      { protocol: "https", hostname: "linqo.de", pathname: "/wp-content/uploads/**" },
      {
        protocol: "https",
        hostname: "sk-bucket.sgp1.cdn.digitaloceanspaces.com",
        pathname: "/**",
      },
      { protocol: "https", hostname: "tse1.explicit.bing.net", pathname: "/th/**" },
      { protocol: "https", hostname: "tse1.mm.bing.net", pathname: "/th/**" },
      { protocol: "https", hostname: "tse2.mm.bing.net", pathname: "/th/**" },
      { protocol: "https", hostname: "tse3.mm.bing.net", pathname: "/th/**" },
      { protocol: "https", hostname: "tse4.mm.bing.net", pathname: "/th/**" },
    ],
  },
  async headers() {
    const security = [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
      },
    ];
    return [
      {
        source: "/:path*",
        headers: security,
      },
      {
        source: "/(favicon.ico|favicon-32.png|favicon-48.png|icon.png|email-header.png|transpool24-email-banner.png|transpool24-email-logo.png|5439.png)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy blog URL reported by Search Console as 404.
      {
        source: "/de/blog/willkommen-transpool24-magazin",
        destination: "/de/blog",
        permanent: true,
      },
      // Keep non-locale public paths on a stable canonical locale URL.
      { source: "/", destination: "/de", permanent: true },
      { source: "/order", destination: "/de/order", permanent: true },
      { source: "/why", destination: "/de/why", permanent: true },
      { source: "/support", destination: "/de/support", permanent: true },
      { source: "/privacy", destination: "/de/privacy", permanent: true },
      { source: "/terms", destination: "/de/terms", permanent: true },
      { source: "/driver", destination: "/de/driver", permanent: true },
      { source: "/blog", destination: "/de/blog", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
