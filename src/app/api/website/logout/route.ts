import { NextResponse } from "next/server";
import { WEBSITE_ADMIN_COOKIE_NAME, websiteAdminSessionCookieOptions } from "@/lib/website-admin-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(WEBSITE_ADMIN_COOKIE_NAME, "", websiteAdminSessionCookieOptions(0));
  return res;
}
