import { DEFAULT_PUBLIC_CONTACT_EMAIL, getPublicContactEmail } from "@/lib/site-contact";
import { PDF_COMPANY } from "@/lib/pdf-company";
import { createServerSupabase } from "@/lib/supabase";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com";
const ICON_PX = 36;
const ICON_CACHE = "20260916e";

export type ResolvedEmailFooter = {
  instagramHref: string;
  linkedinHref: string;
  tiktokHref: string;
  facebookHref: string;
  mailtoPrimary: string;
  mailtoSecondary: string;
  emailDisplayPrimary: string;
  emailDisplaySecondary: string;
};

const DEFAULT: ResolvedEmailFooter = {
  instagramHref: "",
  linkedinHref: "",
  tiktokHref: "",
  facebookHref: "",
  mailtoPrimary: `mailto:${DEFAULT_PUBLIC_CONTACT_EMAIL}`,
  mailtoSecondary: "mailto:transpool24pf@gmail.com",
  emailDisplayPrimary: DEFAULT_PUBLIC_CONTACT_EMAIL,
  emailDisplaySecondary: "transpool24pf@gmail.com",
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

function normalizeHttpUrl(raw: string | null | undefined): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function normalizeEmail(
  raw: string | null | undefined,
  fallbackDisplay: string,
  fallbackMailto: string
): { display: string; mailto: string } {
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
  facebook_url: string | null;
  email_footer_email_primary: string | null;
  email_footer_email_secondary: string | null;
};

/** Load footer links from the same CMS row as /website/social. Empty URL = icon hidden. */
export async function loadEmailFooterSocial(): Promise<ResolvedEmailFooter> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("site_social_media")
      .select(
        "instagram_url, tiktok_url, linkedin_url, facebook_url, email_footer_email_primary, email_footer_email_secondary",
      )
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return DEFAULT;
    const row = data as SocialRow;
    const p = normalizeEmail(
      row.email_footer_email_primary,
      getPublicContactEmail(),
      `mailto:${getPublicContactEmail()}`,
    );
    const s = normalizeEmail(row.email_footer_email_secondary, DEFAULT.emailDisplaySecondary, DEFAULT.mailtoSecondary);
    return {
      instagramHref: normalizeHttpUrl(row.instagram_url),
      linkedinHref: normalizeHttpUrl(row.linkedin_url),
      tiktokHref: normalizeHttpUrl(row.tiktok_url),
      facebookHref: normalizeHttpUrl(row.facebook_url),
      mailtoPrimary: p.mailto,
      mailtoSecondary: s.mailto,
      emailDisplayPrimary: p.display,
      emailDisplaySecondary: s.display,
    };
  } catch {
    return DEFAULT;
  }
}

type FooterIcon = { href: string; src: string; alt: string };

function iconList(footer: ResolvedEmailFooter): FooterIcon[] {
  const items: FooterIcon[] = [];
  if (footer.instagramHref) {
    items.push({ href: footer.instagramHref, src: "instagram.png", alt: "Instagram" });
  }
  if (footer.tiktokHref) {
    items.push({ href: footer.tiktokHref, src: "tiktok.png", alt: "TikTok" });
  }
  if (footer.linkedinHref) {
    items.push({ href: footer.linkedinHref, src: "linkedin.png", alt: "LinkedIn" });
  }
  if (footer.facebookHref) {
    items.push({ href: footer.facebookHref, src: "facebook.png", alt: "Facebook" });
  }
  if (footer.mailtoPrimary) {
    items.push({ href: footer.mailtoPrimary, src: "gmail.png", alt: "Gmail" });
  }
  return items;
}

function iconSrc(file: string): string {
  return `${SITE_URL}/icons/${file}?v=${ICON_CACHE}`;
}

function followUsIconsTableHtml(footer: ResolvedEmailFooter): string {
  const icons = iconList(footer);
  if (icons.length === 0) return "";
  const cells = icons
    .map((ic) => {
      const href = escapeHref(ic.href);
      const src = escapeHref(iconSrc(ic.src));
      const alt = escapeHtml(ic.alt);
      return `<td style="padding:0 8px;vertical-align:middle;"><a href="${href}" target="_blank" rel="noopener" style="display:inline-block;width:${ICON_PX}px;height:${ICON_PX}px;line-height:0;"><img src="${src}" alt="${alt}" width="${ICON_PX}" height="${ICON_PX}" style="display:block;width:${ICON_PX}px;height:${ICON_PX}px;border:0;object-fit:contain;" /></a></td>`;
    })
    .join("");
  return `<table cellpadding="0" cellspacing="0" align="center" role="presentation" style="margin:0 auto;border-collapse:collapse;"><tr>${cells}</tr></table>`;
}

/** Order confirmation / custom customer mail: “Folgen Sie uns” + CMS icons */
export function buildEmailFooterOrderBlock(footer: ResolvedEmailFooter): string {
  const table = followUsIconsTableHtml(footer);
  if (!table) return "";
  return `
        <div style="margin-top: 28px; padding: 24px; background: #ffffff; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #0d2137;">Folgen Sie uns</p>
          ${table}
        </div>`;
}

/** Driver approval: same icon set as other mails */
export function buildEmailFooterApprovalBlock(footer: ResolvedEmailFooter): string {
  const table = followUsIconsTableHtml(footer);
  if (!table) return "";
  return `
            <p style="margin:0 0 12px 0; font-size:12px; color:#0d2137;">Folgen Sie uns</p>
            ${table}`;
}

/** Driver payment invoice: icon row + support copy uses secondary email */
export function buildEmailFooterInvoiceBlock(footer: ResolvedEmailFooter): {
  supportLineHtml: string;
  linkedinLineHtml: string;
  followUsTableHtml: string;
} {
  const sec = escapeHtml(footer.emailDisplaySecondary);
  const supportLineHtml = `<p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">Benötigen Sie Unterstützung? TransPool24 Kundenservice – Telefonnummer: ${PDF_COMPANY.phone} – E-Mail: ${sec}</p>`;
  const li = escapeHref(footer.linkedinHref);
  const linkedinLineHtml = footer.linkedinHref
    ? `<p style="margin: 12px 0 0 0; font-size: 13px;"><a href="${li}" style="color:#0d2137;">LinkedIn</a> · Servicezeiten: rund um die Uhr</p>`
    : `<p style="margin: 12px 0 0 0; font-size: 13px;">Servicezeiten: rund um die Uhr</p>`;
  return { supportLineHtml, linkedinLineHtml, followUsTableHtml: followUsIconsTableHtml(footer) };
}
