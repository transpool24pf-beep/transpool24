import { NextResponse } from "next/server";
import { Resend } from "resend";

function getFromEmail(): string {
  let raw = (process.env.RESEND_FROM_EMAIL ?? "").trim().replace(/^["']|["']$/g, "");
  if (!raw) return "TransPool24 <onboarding@resend.dev>";
  const angleMatch = raw.match(/\s*<\s*([^\s@]+@[^\s@]+\.[^\s@]+)\s*>$/);
  const email = angleMatch ? angleMatch[1] : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : "";
  return email ? `TransPool24 <${email}>` : "TransPool24 <onboarding@resend.dev>";
}

function getToEmail(): string {
  const s = process.env.SUPPORT_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "info@transpool24.com";
  const match = s.match(/<([^>]+)>/) || s.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/);
  return match ? (match[1] || match[0]).trim() : s.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const message = String(body?.message ?? "").trim();
    const driverNumber = body?.driver_number != null ? String(body.driver_number).trim() : "";

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email and message are required" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Email not configured" }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const to = getToEmail();
    const subject = `[TransPool24 Support] ${name}${driverNumber ? ` (Driver #${driverNumber})` : ""}`;
    const html = `
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${driverNumber ? `<p><strong>Driver number:</strong> ${escapeHtml(driverNumber)}</p>` : ""}
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap; background:#f5f5f5; padding:12px; border-radius:8px;">${escapeHtml(message)}</pre>
    `;

    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      replyTo: email,
      subject,
      html,
    });

    if (error) {
      const errMsg = typeof error === "string" ? error : (error as { message?: string })?.message ?? JSON.stringify(error);
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[support]", e);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
