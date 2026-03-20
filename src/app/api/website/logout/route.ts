import { NextResponse } from "next/server";
import { WEBSITE_ADMIN_COOKIE_NAME } from "@/lib/website-admin-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(WEBSITE_ADMIN_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
