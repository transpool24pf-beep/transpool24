/** Public contact shown on the website (mailto, tel, privacy, support sidebar). */

export const DEFAULT_PUBLIC_CONTACT_EMAIL = "transpool24pf@gmail.com";
export const DEFAULT_PUBLIC_CONTACT_PHONE = "+49 179 6923602";

function parseBareEmail(raw: string | undefined): string | null {
  const s = (raw ?? "").trim().replace(/^["']|["']$/g, "");
  if (!s) return null;
  const angle = s.match(/<([^>]+)>/);
  const email = (angle ? angle[1]! : s).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/** Client + server. Override with NEXT_PUBLIC_CONTACT_EMAIL or PUBLIC_CONTACT_EMAIL on Vercel. */
export function getPublicContactEmail(): string {
  return (
    parseBareEmail(process.env.NEXT_PUBLIC_CONTACT_EMAIL) ??
    parseBareEmail(process.env.PUBLIC_CONTACT_EMAIL) ??
    DEFAULT_PUBLIC_CONTACT_EMAIL
  );
}

export function getPublicContactMailto(): string {
  return `mailto:${getPublicContactEmail()}`;
}

export function getPublicContactPhone(): string {
  const raw = (process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "").trim();
  return raw || DEFAULT_PUBLIC_CONTACT_PHONE;
}

export function getPublicContactTelHref(): string {
  return `tel:${getPublicContactPhone().replace(/[\s-]/g, "")}`;
}

export function getPublicContactPhoneDigits(): string {
  return getPublicContactPhone().replace(/\D/g, "");
}

/** Opens WhatsApp chat with the public TransPool24 number. */
export function getPublicContactWhatsAppHref(prefill?: string): string {
  const digits = getPublicContactPhoneDigits();
  const q = prefill?.trim() ? `?text=${encodeURIComponent(prefill.trim())}` : "";
  return `https://wa.me/${digits}${q}`;
}
