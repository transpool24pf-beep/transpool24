import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerSupabase } from "@/lib/supabase";

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
    const requesterType = body?.requester_type === "customer" ? "customer" : "driver";
    const driverNumberRaw = body?.driver_number != null ? String(body.driver_number).trim() : "";
    const jobId = body?.job_id != null ? String(body.job_id).trim() : null;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, E-Mail und Nachricht sind Pflichtfelder." },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Ungültige E-Mail." }, { status: 400 });
    }

    const supabase = createServerSupabase();
    let driverNumber: number | null = null;
    if (requesterType === "driver") {
      if (!driverNumberRaw) {
        return NextResponse.json(
          { error: "Fahrernummer ist ein Pflichtfeld." },
          { status: 400 }
        );
      }
      driverNumber = parseInt(driverNumberRaw, 10);
      if (Number.isNaN(driverNumber) || driverNumber < 10000) {
        return NextResponse.json(
          { error: "Ungültige Fahrernummer." },
          { status: 400 }
        );
      }
      const { data: driver } = await supabase
        .from("driver_applications")
        .select("id, full_name")
        .eq("driver_number", driverNumber)
        .eq("status", "approved")
        .maybeSingle();
      if (!driver) {
        return NextResponse.json(
          { error: "Diese Fahrernummer ist nicht in der Datenbank registriert oder nicht genehmigt." },
          { status: 400 }
        );
      }
    }

    const insertPayload: Record<string, unknown> = {
      driver_number: driverNumber,
      name,
      email,
      message,
      requester_type: requesterType,
      customer_email: requesterType === "customer" ? email : null,
      job_id: jobId || null,
    };

    const { error: insertErr } = await supabase.from("support_requests").insert(insertPayload);
    if (insertErr) {
      console.error("[support] insert", insertErr);
      return NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      const to = getToEmail();
      const subject =
        requesterType === "customer"
          ? `[TransPool24 Support] Kunde: ${name}`
          : `[TransPool24 Support] ${name} (Fahrer #${driverNumber})`;
      const html = `
      <p><strong>Typ:</strong> ${escapeHtml(requesterType === "customer" ? "Kunde" : "Fahrer")}</p>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Fahrernummer:</strong> ${driverNumber != null ? escapeHtml(String(driverNumber)) : "—"}</p>
      ${jobId ? `<p><strong>Job-ID:</strong> ${escapeHtml(jobId)}</p>` : ""}
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
      if (error) console.error("[support] email", error);
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
