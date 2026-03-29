import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";

/**
 * Authenticated summary of the running deployment (Vercel env vars when present).
 * Shown in admin footer after login.
 */
export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  return NextResponse.json({
    vercelEnv: process.env.VERCEL_ENV ?? null,
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    vercelUrl: process.env.VERCEL_URL ?? null,
    publicCookieBanner: { version: 1, mandatory: true, storageKey: "tp24_cookie_consent" },
    publicLegalPages: ["/privacy", "/terms"],
  });
}
