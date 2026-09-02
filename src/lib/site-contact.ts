/** Public contact email shown on the website (mailto links, privacy, support sidebar). */

export const DEFAULT_PUBLIC_CONTACT_EMAIL = "hello@transpool24.com";

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
