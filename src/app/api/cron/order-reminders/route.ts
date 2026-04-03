import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { sendOpsStatusReminderEmail } from "@/lib/email-ops-reminder";

/**
 * Vercel Cron: daily reminder for paid orders still in early logistics (no assignment yet).
 * Env: CRON_SECRET (Authorization: Bearer), RESEND_API_KEY, DB column jobs.last_ops_reminder_at (see supabase/hardening_2026.sql).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const now = Date.now();
  const minOrderAgeMs = 72 * 60 * 60 * 1000;
  const minGapBetweenRemindersMs = 7 * 24 * 60 * 60 * 1000;

  const { data: rows, error } = await supabase
    .from("jobs")
    .select("id, order_number, company_name, customer_email, confirmation_token, created_at, last_ops_reminder_at, logistics_status, payment_status")
    .eq("payment_status", "paid")
    .in("logistics_status", ["paid", "confirmed"])
    .not("customer_email", "is", null)
    .limit(80);

  if (error) {
    console.error("[cron/order-reminders]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  for (const j of rows ?? []) {
    const email = (j.customer_email as string)?.trim();
    if (!email) {
      skipped++;
      continue;
    }
    const created = new Date(j.created_at as string).getTime();
    if (now - created < minOrderAgeMs) {
      skipped++;
      continue;
    }
    const last = j.last_ops_reminder_at ? new Date(j.last_ops_reminder_at as string).getTime() : 0;
    if (last && now - last < minGapBetweenRemindersMs) {
      skipped++;
      continue;
    }
    const r = await sendOpsStatusReminderEmail(email, {
      id: j.id as string,
      order_number: j.order_number as number | null,
      company_name: (j.company_name as string) || "",
      confirmation_token: (j.confirmation_token as string | null) ?? null,
    });
    if (!r.ok) {
      console.error("[cron/order-reminders] email failed", j.id, r.error);
      continue;
    }
    const { error: upErr } = await supabase
      .from("jobs")
      .update({ last_ops_reminder_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", j.id as string);
    if (upErr) console.error("[cron/order-reminders] update failed", j.id, upErr);
    else sent++;
  }

  return NextResponse.json({ ok: true, sent, skipped, scanned: rows?.length ?? 0 });
}
