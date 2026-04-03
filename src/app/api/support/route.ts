import { NextResponse } from "next/server";
import { Resend } from "resend";
import { rateLimitResponse } from "@/lib/rate-limit";
import { loadTransactionalEmailBranding } from "@/lib/email";
import { createServerSupabase } from "@/lib/supabase";
import { buildPhoneE164 } from "@/lib/country-dial-codes";

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
    const limited = rateLimitResponse(req, "support");
    if (limited) return limited;
    const body = await req.json();
    const requesterType = body?.requester_type === "driver" ? "driver" : "customer";

    const firstName = String(body?.first_name ?? "").trim();
    const lastName = String(body?.last_name ?? "").trim();
    const nameFromClient = String(body?.name ?? "").trim();
    const name =
      nameFromClient || `${firstName} ${lastName}`.trim() || String(body?.name_legacy ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const message = String(body?.message ?? "").trim();
    const privacyAccepted = body?.privacy_accepted === true;
    const marketingOptIn = body?.marketing_opt_in === true;

    const dial = String(body?.dial ?? "49").replace(/\D/g, "") || "49";
    const national = String(body?.national_phone ?? body?.national ?? "").trim();
    let phoneE164 = String(body?.phone_e164 ?? "").replace(/\D/g, "");
    if (!phoneE164) phoneE164 = buildPhoneE164(dial, national) ?? "";

    const company = String(body?.company ?? "").trim();
    const country = String(body?.country ?? "").trim();
    const inquiryType = String(body?.inquiry_type ?? "").trim();
    const commLanguage = String(body?.comm_language ?? "").trim();
    const pageLocale = String(body?.page_locale ?? "").trim().slice(0, 5);

    const driverNumberRaw = body?.driver_number != null ? String(body.driver_number).trim() : "";
    const jobId = body?.job_id != null ? String(body.job_id).trim() : null;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, E-Mail und Nachricht sind Pflichtfelder." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Ungültige E-Mail." }, { status: 400 });
    }
    if (!privacyAccepted) {
      return NextResponse.json({ error: "Bitte stimmen Sie der Datenschutzerklärung zu." }, { status: 400 });
    }
    if (!phoneE164 || phoneE164.length < 10) {
      return NextResponse.json({ error: "Bitte gültige Telefon-/WhatsApp-Nummer mit Vorwahl." }, { status: 400 });
    }
    if (message.length > 500) {
      return NextResponse.json({ error: "Nachricht zu lang (max. 500 Zeichen)." }, { status: 400 });
    }

    const supabase = createServerSupabase();
    let driverNumber: number | null = null;

    if (requesterType === "driver") {
      if (!driverNumberRaw) {
        return NextResponse.json({ error: "Fahrernummer ist ein Pflichtfeld." }, { status: 400 });
      }
      driverNumber = parseInt(driverNumberRaw, 10);
      if (Number.isNaN(driverNumber) || driverNumber < 10000) {
        return NextResponse.json({ error: "Ungültige Fahrernummer." }, { status: 400 });
      }
      const { data: driver } = await supabase
        .from("driver_applications")
        .select("id, full_name")
        .eq("driver_number", driverNumber)
        .eq("status", "approved")
        .maybeSingle();
      if (!driver) {
        return NextResponse.json(
          { error: "Diese Fahrernummer ist nicht registriert oder nicht genehmigt." },
          { status: 400 },
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
      phone_e164: phoneE164,
      first_name: firstName || null,
      last_name: lastName || null,
      company: company || null,
      country: country || null,
      inquiry_type: inquiryType || null,
      comm_language: commLanguage || null,
      page_locale: pageLocale || null,
      privacy_accepted: privacyAccepted,
      marketing_opt_in: marketingOptIn,
    };

    const { error: insertErr } = await supabase.from("support_requests").insert(insertPayload);
    if (insertErr) {
      console.error("[support] insert", insertErr);
      if (insertErr.message?.includes("phone_e164") || insertErr.code === "42703") {
        return NextResponse.json(
          {
            error:
              "Datenbank-Update fehlt: supabase/support_requests_contact_enhancement.sql in Supabase ausführen.",
          },
          { status: 500 },
        );
      }
      return NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      const to = getToEmail();
      const branding = await loadTransactionalEmailBranding();
      const subject =
        requesterType === "customer"
          ? `[TransPool24 Kontakt] ${name} (${inquiryType || "Anfrage"})`
          : `[TransPool24 Support] ${name} (Fahrer #${driverNumber})`;
      const html = `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8" /></head>
<body style="margin:0; font-family:'Segoe UI',Tahoma,sans-serif; background:#f4f4f4;">
${branding.headerHtml}
<div style="max-width:600px; margin:0 auto; padding:24px 20px;">
  <div style="background:#fff; border-radius:12px; padding:24px; box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <p><strong>Typ:</strong> ${escapeHtml(requesterType === "customer" ? "Kunde / Allgemein" : "Fahrer")}</p>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>E-Mail:</strong> ${escapeHtml(email)}</p>
    <p><strong>WhatsApp:</strong> +${escapeHtml(phoneE164)}</p>
    ${company ? `<p><strong>Firma:</strong> ${escapeHtml(company)}</p>` : ""}
    ${country ? `<p><strong>Land:</strong> ${escapeHtml(country)}</p>` : ""}
    ${inquiryType ? `<p><strong>Anfrage:</strong> ${escapeHtml(inquiryType)}</p>` : ""}
    ${commLanguage ? `<p><strong>Sprache:</strong> ${escapeHtml(commLanguage)}</p>` : ""}
    ${pageLocale ? `<p><strong>Seite:</strong> ${escapeHtml(pageLocale)}</p>` : ""}
    <p><strong>Marketing OK:</strong> ${marketingOptIn ? "Ja" : "Nein"}</p>
    <p><strong>Fahrernummer:</strong> ${driverNumber != null ? escapeHtml(String(driverNumber)) : "—"}</p>
    ${jobId ? `<p><strong>Job-ID:</strong> ${escapeHtml(jobId)}</p>` : ""}
    <p><strong>Nachricht:</strong></p>
    <pre style="white-space:pre-wrap; background:#f5f5f5; padding:12px; border-radius:8px;">${escapeHtml(message)}</pre>
  </div>
</div>
</body>
</html>`;
      const logoAtt = branding.logoAttachment ? [branding.logoAttachment] : undefined;
      const { error } = await resend.emails.send({
        from: getFromEmail(),
        to: [to],
        replyTo: email,
        subject,
        html,
        ...(logoAtt ? { attachments: logoAtt } : {}),
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
