import { locales, type Locale } from "@/i18n/routing";

export const CANONICAL_HOST = "www.transpool24.com";
export const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;

const SKIP_PREFIX = new Set(["admin", "api", "website"]);

function stripTrailingSlash(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname || "/";
}

/** One-hop 308 target: https + www + locale prefix. Null if the request is already canonical. */
export function resolveCanonicalRedirect(
  hostname: string,
  pathname: string,
  search = "",
): string | null {
  const host = hostname.split(":")[0].toLowerCase();
  const path = stripTrailingSlash(pathname);
  const segments = path.split("/").filter(Boolean);
  const first = segments[0] ?? "";

  if (SKIP_PREFIX.has(first)) {
    if (host === "transpool24.com") {
      return `${CANONICAL_ORIGIN}${path === "/" ? "" : path}${search}`;
    }
    return null;
  }

  let nextPath = path;
  if (!first) {
    nextPath = "/de";
  } else if (!(locales as readonly string[]).includes(first)) {
    nextPath = `/de${path}`;
  }

  const needHost = host === "transpool24.com";
  const needPath = nextPath !== path;
  if (!needHost && !needPath) return null;
  return `${CANONICAL_ORIGIN}${nextPath}${search}`;
}

export function isAppLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
