import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Locale-prefixed /website/* → /website/* (preserve subpath, e.g. /ar/website/transport)
  const websiteLocale = pathname.match(/^\/([a-z]{2})\/website(\/.*)?$/);
  if (websiteLocale) {
    const url = request.nextUrl.clone();
    const rest = websiteLocale[2] ?? "";
    url.pathname = "/website" + (rest || "");
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|admin|website|.*\\..*).*)"],
};
