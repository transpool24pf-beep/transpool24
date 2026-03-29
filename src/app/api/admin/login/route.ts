import { NextResponse } from "next/server";
import { createAdminSession, COOKIE_NAME, passwordMatchesConstantTime } from "@/lib/admin-auth";
import { ADMIN_SESSION_MAX_AGE_SEC } from "@/lib/admin-auth-constants";

function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = typeof body?.password === "string" ? body.password : "";
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
    }
    if (!passwordMatchesConstantTime(password, expected)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    const token = createAdminSession();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: "lax",
      maxAge: ADMIN_SESSION_MAX_AGE_SEC,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("[admin/login]", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
