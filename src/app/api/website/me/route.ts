import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyWebsiteAdminSession, WEBSITE_ADMIN_COOKIE_NAME } from "@/lib/website-admin-auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEBSITE_ADMIN_COOKIE_NAME)?.value;
  if (!token || !verifyWebsiteAdminSession(token)) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}
