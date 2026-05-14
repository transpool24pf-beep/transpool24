import { NextResponse } from "next/server";
import { type Locale, routing } from "@/i18n/routing";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com";

/** Minimal valid AMP document with AdSense AMP auto-ads (raw HTML — no React root layout). */
function ampDocument(locale: Locale): string {
  const canonical = `${SITE}/${locale}`;
  return `<!doctype html>
<html ⚡ lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
  <title>TransPool24</title>
  <link rel="canonical" href="${canonical}" />
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-auto-ads" src="https://cdn.ampproject.org/v0/amp-auto-ads-0.1.js"></script>
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
  <noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
</head>
<body>
<amp-auto-ads type="adsense" data-ad-client="ca-pub-9998186124580672"></amp-auto-ads>
<main>
  <h1>TransPool24</h1>
  <p>Digital logistics &amp; road transport — <a href="${canonical}">View full site</a>.</p>
</main>
</body>
</html>`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ locale: string }> },
): Promise<NextResponse> {
  const { locale: raw } = await context.params;
  if (!routing.locales.includes(raw as Locale)) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  const locale = raw as Locale;
  return new NextResponse(ampDocument(locale), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
