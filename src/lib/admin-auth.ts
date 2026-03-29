import { createHmac, createHash, timingSafeEqual } from "crypto";
import { ADMIN_SESSION_MAX_AGE_MS, COOKIE_NAME } from "./admin-auth-constants";

function getSecret(): string {
  const s = process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("ADMIN_PASSWORD is required for admin");
  return s;
}

export function createAdminSession(): string {
  const secret = getSecret();
  const t = String(Date.now());
  const h = createHmac("sha256", secret).update(t).digest("base64url");
  return Buffer.from(JSON.stringify({ t, h })).toString("base64url");
}

export function verifyAdminSession(token: string): boolean {
  try {
    const secret = getSecret();
    const raw = JSON.parse(Buffer.from(token, "base64url").toString());
    const { t, h } = raw;
    if (typeof t !== "string" || typeof h !== "string") return false;
    const ts = parseInt(t, 10);
    if (Number.isNaN(ts) || Date.now() - ts > ADMIN_SESSION_MAX_AGE_MS) return false;
    const expected = createHmac("sha256", secret).update(t).digest("base64url");
    return timingSafeEqual(Buffer.from(h, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

/** Compare admin password without early-exit timing leaks (fixed-size SHA-256 digest compare). */
export function passwordMatchesConstantTime(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

export function getAdminSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export { COOKIE_NAME };
