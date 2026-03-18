/** Shared company data for all PDFs (invoices, driver approval). Logo: 345remov.png */

export const PDF_COMPANY = {
  name: "TransPool24",
  website: "www.transpool24.com",
  email: "transpool24@hotmail.com",
  phone: "+49 176 29767442",
} as const;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com";

/** Load logo for PDFs: env base64 first, then fetch from site so logo always appears in production. */
export async function getPdfLogoBytes(): Promise<Uint8Array | null> {
  try {
    const base64 = process.env.INVOICE_LOGO_BASE64;
    if (base64 && typeof base64 === "string") {
      return new Uint8Array(Buffer.from(base64, "base64"));
    }
  } catch {
    // fallback below
  }
  try {
    const res = await fetch(`${SITE_URL}/345remov.png`);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    }
  } catch {
    // no logo
  }
  return null;
}
