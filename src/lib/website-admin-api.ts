import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyWebsiteAdminSession, WEBSITE_ADMIN_COOKIE_NAME } from "./website-admin-auth";

export async function requireWebsiteAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEBSITE_ADMIN_COOKIE_NAME)?.value;
  if (!token || !verifyWebsiteAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
