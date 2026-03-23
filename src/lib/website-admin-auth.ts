import { createHmac, timingSafeEqual } from "crypto";

export const WEBSITE_ADMIN_COOKIE_NAME = "website_admin_session";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function getWebsiteAdminSecret(): string {
  const s = process.env.WEBSITE_ADMIN_PASSWORD;
  if (!s) throw new Error("WEBSITE_ADMIN_PASSWORD is required for website CMS");
  return s;
}

export function createWebsiteAdminSession(): string {
  const secret = getWebsiteAdminSecret();
  const t = String(Date.now());
  const h = createHmac("sha256", secret).update(t).digest("base64url");
  return Buffer.from(JSON.stringify({ t, h })).toString("base64url");
}

/**
 * Cookie flags for login/logout. Set WEBSITE_ADMIN_COOKIE_DOMAIN=.transpool24.com in production
 * so the same session works on www and apex.
 */
export function websiteAdminSessionCookieOptions(maxAgeSeconds: number) {
  const opts: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
    domain?: string;
  } = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  };
  const raw = process.env.WEBSITE_ADMIN_COOKIE_DOMAIN?.trim();
  if (raw && process.env.NODE_ENV === "production") {
    const host = raw.replace(/^\.+/, "").replace(/\.+$/, "");
    if (host) opts.domain = `.${host}`;
  }
  return opts;
}

export function verifyWebsiteAdminSession(token: string): boolean {
  try {
    const secret = getWebsiteAdminSecret();
    const raw = JSON.parse(Buffer.from(token, "base64url").toString());
    const { t, h } = raw;
    if (typeof t !== "string" || typeof h !== "string") return false;
    const ts = parseInt(t, 10);
    if (Number.isNaN(ts) || Date.now() - ts > MAX_AGE_MS) return false;
    const expected = createHmac("sha256", secret).update(t).digest("base64url");
    return timingSafeEqual(Buffer.from(h, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}
