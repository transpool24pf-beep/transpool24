import { ADMIN_SESSION_MAX_AGE_MS } from "./admin-auth-constants";

function decodeBase64UrlToUtf8(input: string): string {
  let b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function arrayBufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function timingSafeEqualAscii(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return arrayBufferToBase64Url(sig);
}

/**
 * Same rules as verifyAdminSession() in admin-auth.ts, implemented with Web Crypto for Edge middleware.
 */
export async function verifyAdminSessionEdge(token: string): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;
  try {
    const json = decodeBase64UrlToUtf8(token);
    const raw = JSON.parse(json) as { t?: unknown; h?: unknown };
    const t = raw.t;
    const h = raw.h;
    if (typeof t !== "string" || typeof h !== "string") return false;
    const ts = parseInt(t, 10);
    if (Number.isNaN(ts) || Date.now() - ts > ADMIN_SESSION_MAX_AGE_MS) return false;
    const expected = await hmacSha256Base64Url(secret, t);
    return timingSafeEqualAscii(h, expected);
  } catch {
    return false;
  }
}
