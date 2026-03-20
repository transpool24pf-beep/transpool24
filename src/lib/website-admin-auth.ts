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
