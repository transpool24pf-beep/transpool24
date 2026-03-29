import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/admin-auth-constants";

function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
  });
  return res;
}
