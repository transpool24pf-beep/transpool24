import { NextResponse } from "next/server";
import { createWebsiteAdminSession, WEBSITE_ADMIN_COOKIE_NAME } from "@/lib/website-admin-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = body;
    const expected = process.env.WEBSITE_ADMIN_PASSWORD;
    if (!expected) {
      return NextResponse.json(
        { error: "Website CMS not configured (set WEBSITE_ADMIN_PASSWORD)" },
        { status: 500 },
      );
    }
    if (password !== expected) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    const token = createWebsiteAdminSession();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(WEBSITE_ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("[website/login]", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
