import { NextResponse } from "next/server";
import { createAdminSession, COOKIE_NAME } from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = body;
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
    }
    if (password !== expected) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    const token = createAdminSession();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("[admin/login]", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
