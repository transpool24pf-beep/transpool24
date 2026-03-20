import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect any locale-prefixed /website paths to /website (e.g., /ar/website -> /website)
  if (pathname.match(/^\/[a-z]{2}\/website/)) {
    const url = request.nextUrl.clone();
    url.pathname = "/website";
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|admin|website|.*\\..*).*)"],
};
