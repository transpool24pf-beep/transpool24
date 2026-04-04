import { createServerSupabase } from "@/lib/supabase";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com";

export type ResolvedEmailFooter = {
  instagramHref: string;
  linkedinHref: string;
  tiktokHref: string;
  mailtoPrimary: string;
  mailtoSecondary: string;
  emailDisplayPrimary: string;
  emailDisplaySecondary: string;
};

const DEFAULT: ResolvedEmailFooter = {
  instagramHref: "https://www.instagram.com/transpool24/",
  linkedinHref: "https://www.linkedin.com/in/trans-pool-1235803b8",
  tiktokHref: "https://www.tiktok.com/@transpool24",
  mailtoPrimary: "mailto:transpool24pf@gmail.com",
  mailtoSecondary: "mailto:transpool24@hotmail.com",
  emailDisplayPrimary: "transpool24pf@gmail.com",
  emailDisplaySecondary: "transpool24@hotmail.com",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHref(u: string): string {
  return u.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function normalizeHttpUrl(raw: string | null | undefined, fallback: string): string {
  const t = (raw ?? "").trim();
  if (!t) return fallback;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function normalizeEmail(raw: string | null | undefined, fallbackDisplay: string, fallbackMailto: string): { display: string; mailto: string } {
  const t = (raw ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
    return { display: fallbackDisplay, mailto: fallbackMailto };
  }
  return { display: t, mailto: `mailto:${t}` };
}

type SocialRow = {
  instagram_url: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
  email_footer_email_primary: string | null;
  email_footer_email_secondary: string | null;
};

/** Load footer links for transactional emails (Supabase + safe fallbacks). */
export async function loadEmailFooterSocial(): Promise<ResolvedEmailFooter> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("site_social_media")
      .select(
        "instagram_url, tiktok_url, linkedin_url, email_footer_email_primary, email_footer_email_secondary",
      )
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return DEFAULT;
    const row = data as SocialRow;
    const p = normalizeEmail(row.email_footer_email_primary, DEFAULT.emailDisplayPrimary, DEFAULT.mailtoPrimary);
    const s = normalizeEmail(row.email_footer_email_secondary, DEFAULT.emailDisplaySecondary, DEFAULT.mailtoSecondary);
    return {
      instagramHref: normalizeHttpUrl(row.instagram_url, DEFAULT.instagramHref),
      linkedinHref: normalizeHttpUrl(row.linkedin_url, DEFAULT.linkedinHref),
      tiktokHref: normalizeHttpUrl(row.tiktok_url, DEFAULT.tiktokHref),
      mailtoPrimary: p.mailto,
      mailtoSecondary: s.mailto,
      emailDisplayPrimary: p.display,
      emailDisplaySecondary: s.display,
    };
  } catch {
    return DEFAULT;
  }
}

/** Order confirmation card: “Folgen Sie uns” + 5 icons + email line */
export function buildEmailFooterOrderBlock(footer: ResolvedEmailFooter): string {
  const ig = escapeHref(footer.instagramHref);
  const li = escapeHref(footer.linkedinHref);
  const tt = escapeHref(footer.tiktokHref);
  const m1 = escapeHref(footer.mailtoPrimary);
  const m2 = escapeHref(footer.mailtoSecondary);
  const d1 = escapeHtml(footer.emailDisplayPrimary);
  const d2 = escapeHtml(footer.emailDisplaySecondary);
  return `
        <div style="margin-top: 28px; padding: 24px; background: #0d2137; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #fff;">Folgen Sie uns</p>
          <table cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
            <tr>
              <td style="padding: 0 10px;"><a href="${ig}" target="_blank" rel="noopener" style="display:inline-block;"><img src="${SITE_URL}/icons/instagram.png" alt="Instagram" width="32" height="32" style="display:block; width:32px; height:32px;" /></a></td>
              <td style="padding: 0 10px;"><a href="${li}" target="_blank" rel="noopener" style="display:inline-block;"><img src="${SITE_URL}/icons/linkedin.png" alt="LinkedIn" width="32" height="32" style="display:block; width:32px; height:32px;" /></a></td>
              <td style="padding: 0 10px;"><a href="${tt}" target="_blank" rel="noopener" style="display:inline-block;"><img src="${SITE_URL}/icons/tiktok.png" alt="TikTok" width="32" height="32" style="display:block; width:32px; height:32px;" /></a></td>
              <td style="padding: 0 10px;"><a href="${m1}" style="display:inline-block;"><img src="${SITE_URL}/icons/gmail.svg" alt="Gmail" width="32" height="32" style="display:block; width:32px; height:32px;" /></a></td>
              <td style="padding: 0 10px;"><a href="${m2}" style="display:inline-block;"><img src="${SITE_URL}/icons/email.svg" alt="Email" width="32" height="32" style="display:block; width:32px; height:32px;" /></a></td>
            </tr>
          </table>
          <p style="margin: 12px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.8);">${d1} · ${d2}</p>
        </div>`;
}

/** Driver approval: three network icons only */
export function buildEmailFooterApprovalBlock(footer: ResolvedEmailFooter): string {
  const ig = escapeHref(footer.instagramHref);
  const li = escapeHref(footer.linkedinHref);
  const tt = escapeHref(footer.tiktokHref);
  return `
            <p style="margin:0 0 12px 0; font-size:12px; color:rgba(255,255,255,0.8);">Folgen Sie uns</p>
            <p style="margin:0; font-size:0; line-height:0;">
              <a href="${ig}" target="_blank" rel="noopener" style="display:inline-block; margin:0 14px; vertical-align:middle;"><img src="${SITE_URL}/icons/instagram.png" alt="Instagram" width="32" height="32" style="display:block; width:32px; height:32px;" /></a>
              <a href="${li}" target="_blank" rel="noopener" style="display:inline-block; margin:0 14px; vertical-align:middle;"><img src="${SITE_URL}/icons/linkedin.png" alt="LinkedIn" width="32" height="32" style="display:block; width:32px; height:32px;" /></a>
              <a href="${tt}" target="_blank" rel="noopener" style="display:inline-block; margin:0 14px; vertical-align:middle;"><img src="${SITE_URL}/icons/tiktok.png" alt="TikTok" width="32" height="32" style="display:block; width:32px; height:32px;" /></a>
            </p>`;
}

/** Driver payment invoice: icon row + support copy uses secondary email */
export function buildEmailFooterInvoiceBlock(footer: ResolvedEmailFooter): {
  supportLineHtml: string;
  linkedinLineHtml: string;
  followUsTableHtml: string;
} {
  const ig = escapeHref(footer.instagramHref);
  const li = escapeHref(footer.linkedinHref);
  const tt = escapeHref(footer.tiktokHref);
  const sec = escapeHtml(footer.emailDisplaySecondary);
  const supportLineHtml = `<p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">Benötigen Sie Unterstützung? TransPool24 Kundenservice – Telefonnummer: +49 176 29767442 – E-Mail: ${sec}</p>`;
  const linkedinLineHtml = `<p style="margin: 12px 0 0 0; font-size: 13px;"><a href="${li}" style="color:#0d2137;">LinkedIn</a> · Servicezeiten: rund um die Uhr</p>`;
  const followUsTableHtml = `
        <table cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
          <tr>
            <td style="padding: 0 10px;"><a href="${tt}" target="_blank" rel="noopener"><img src="${SITE_URL}/icons/tiktok.png" alt="TikTok" width="32" height="32" style="display:block; width:32px; height:32px;" /></a></td>
            <td style="padding: 0 10px;"><a href="${li}" target="_blank" rel="noopener"><img src="${SITE_URL}/icons/linkedin.png" alt="LinkedIn" width="32" height="32" style="display:block; width:32px; height:32px;" /></a></td>
            <td style="padding: 0 10px;"><a href="${ig}" target="_blank" rel="noopener"><img src="${SITE_URL}/icons/instagram.png" alt="Instagram" width="32" height="32" style="display:block; width:32px; height:32px;" /></a></td>
          </tr>
        </table>`;
  return { supportLineHtml, linkedinLineHtml, followUsTableHtml };
}
