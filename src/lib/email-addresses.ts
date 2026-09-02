/** Parse "Name <a@b.com>" or bare email from env. */
export function parseEnvEmail(raw: string | undefined): string | null {
  const s = (raw ?? "").trim().replace(/^["']|["']$/g, "");
  if (!s) return null;
  const angle = s.match(/\s*<\s*([^\s@]+@[^\s@]+\.[^\s@]+)\s*>$/);
  if (angle) return angle[1]!;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return s;
  return null;
}

const DEFAULT_FROM_EMAIL = "onboarding@resend.dev";

function formatFromAddress(
  rawEnv: string | undefined,
  defaultDisplayName: string,
  defaultEmail: string,
): string {
  const email = parseEnvEmail(rawEnv);
  if (!email) {
    if (!rawEnv?.trim()) return `${defaultDisplayName} <${defaultEmail}>`;
    return `TransPool24 <${DEFAULT_FROM_EMAIL}>`;
  }
  const raw = rawEnv!.trim().replace(/^["']|["']$/g, "");
  const nameMatch = raw.match(/^([^<]+)</);
  const name = nameMatch ? nameMatch[1]!.trim() : defaultDisplayName;
  return `${name} <${email}>`;
}

/**
 * Automated transactional mail (orders, tracking, invoices, driver approval).
 * Vercel: RESEND_FROM_EMAIL=TransPool24 <info@transpool24.com>
 */
export function getInfoFromEmail(): string {
  return formatFromAddress(
    process.env.RESEND_FROM_EMAIL_INFO ?? process.env.RESEND_FROM_EMAIL,
    "TransPool24",
    "info@transpool24.com",
  );
}

/**
 * Manual Admin compose (/admin/customer-email).
 * Vercel: RESEND_SUPPORT_FROM_EMAIL=TransPool24 Support <support@transpool24.com>
 */
export function getSupportFromEmail(): string {
  return formatFromAddress(
    process.env.RESEND_SUPPORT_FROM_EMAIL,
    "TransPool24 Support",
    "support@transpool24.com",
  );
}

/** @deprecated Use getInfoFromEmail — kept for support-form notifications. */
export function getResendFromEmail(): string {
  return getInfoFromEmail();
}

/**
 * Where customer replies land (Reply-To header).
 * Set REPLY_TO_EMAIL=transpool24pf@gmail.com
 */
export function getCustomerReplyToEmail(): string | undefined {
  const email =
    parseEnvEmail(process.env.REPLY_TO_EMAIL) ??
    parseEnvEmail(process.env.SUPPORT_INBOX_EMAIL) ??
    parseEnvEmail(process.env.SUPPORT_EMAIL);
  return email ?? undefined;
}

/** Inbox for support-form notifications (TO admin). */
export function getSupportInboxEmail(): string {
  return (
    parseEnvEmail(process.env.SUPPORT_EMAIL) ??
    parseEnvEmail(process.env.REPLY_TO_EMAIL) ??
    parseEnvEmail(process.env.RESEND_SUPPORT_FROM_EMAIL) ??
    "transpool24pf@gmail.com"
  );
}

function withReplyTo(from: string): { from: string; replyTo?: string } {
  const replyTo = getCustomerReplyToEmail();
  return replyTo ? { from, replyTo } : { from };
}

/** Orders, tracking, invoices — info@ */
export function transactionalEmailSendOptions(): { from: string; replyTo?: string } {
  return withReplyTo(getInfoFromEmail());
}

/** Admin → customer free-form — support@ */
export function manualCustomerEmailSendOptions(): { from: string; replyTo?: string } {
  return withReplyTo(getSupportFromEmail());
}

/** @deprecated Use transactionalEmailSendOptions */
export function customerEmailSendOptions(): { from: string; replyTo?: string } {
  return transactionalEmailSendOptions();
}
