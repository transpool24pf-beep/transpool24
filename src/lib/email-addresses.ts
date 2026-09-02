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

/** Outbound From — set RESEND_FROM_EMAIL=TransPool24 Support <support@transpool24.com> in production. */
export function getResendFromEmail(): string {
  const email = parseEnvEmail(process.env.RESEND_FROM_EMAIL);
  if (!email) return `TransPool24 <${DEFAULT_FROM_EMAIL}>`;
  const raw = process.env.RESEND_FROM_EMAIL!.trim().replace(/^["']|["']$/g, "");
  const nameMatch = raw.match(/^([^<]+)</);
  const name = nameMatch ? nameMatch[1]!.trim() : "TransPool24";
  return `${name} <${email}>`;
}

/**
 * Where customer replies land (Reply-To header).
 * Set REPLY_TO_EMAIL=transpool24pf@gmail.com — replies skip support@ inbox.
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
    parseEnvEmail(process.env.RESEND_FROM_EMAIL) ??
    "info@transpool24.com"
  );
}

export function customerEmailSendOptions(): {
  from: string;
  replyTo?: string;
} {
  const from = getResendFromEmail();
  const replyTo = getCustomerReplyToEmail();
  return replyTo ? { from, replyTo } : { from };
}
