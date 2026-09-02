import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { sendCustomCustomerEmail } from "@/lib/email";

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const to = typeof (body as { to?: unknown }).to === "string" ? (body as { to: string }).to : "";
  const subject = typeof (body as { subject?: unknown }).subject === "string" ? (body as { subject: string }).subject : "";
  const message = typeof (body as { message?: unknown }).message === "string" ? (body as { message: string }).message : "";

  const result = await sendCustomCustomerEmail(to, subject, message);
  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
