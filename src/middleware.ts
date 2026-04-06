import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/admin-auth-constants";
import { verifyAdminSessionEdge } from "@/lib/admin-auth-edge";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function safeAdminNextPath(next: string | null): string {
  if (
    next &&
    next.startsWith("/admin") &&
    !next.startsWith("/admin/login") &&
    !next.includes("//") &&
    !next.includes("\\")
  ) {
    return next;
  }
  return "/admin/orders";
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/de/blog/willkommen-transpool24-magazin") {
    const to = request.nextUrl.clone();
    to.pathname = "/de/blog";
    to.search = "";
    return NextResponse.redirect(to, 308);
  }

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      const token = request.cookies.get(COOKIE_NAME)?.value;
      if (token && (await verifyAdminSessionEdge(token))) {
        const dest = safeAdminNextPath(request.nextUrl.searchParams.get("next"));
        return NextResponse.redirect(new URL(dest, request.url));
      }
      return NextResponse.next();
    }

    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token || !(await verifyAdminSessionEdge(token))) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

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
  matcher: ["/((?!api|_next|_vercel|website|.*\\..*).*)"],
};
