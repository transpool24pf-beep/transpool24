/** Shared company data for all PDFs (invoices, driver approval). */

export const PDF_COMPANY = {
  name: "TransPool24",
  /** Registered sole proprietor (Gewerbe-Anmeldung Pforzheim) */
  legalOwner: "Omar Mdeik",
  legalForm: "Einzelunternehmen",
  street: "Kaiser-Friedrich-Straße 139",
  postalCode: "75172",
  city: "Pforzheim",
  country: "Deutschland",
  addressLine: "Kaiser-Friedrich-Str. 139, 75172 Pforzheim",
  /** Finanzamt Düsseldorf-Mitte (Stand 25.06.2026) */
  taxNumber: "133/2387/5403",
  /** Steuerliche Identifikationsnummer (IdNr.) */
  taxIdentificationNumber: "28 087 154 391",
  website: "www.transpool24.com",
  websiteUrl: "https://www.transpool24.com/de",
  email: "transpool24pf@gmail.com",
  phone: "+49 179 6923602",
  /** Same as phone; used on invoice/contract contact block */
  invoicePhone: "+49 179 6923602",
  bankName: "Targobank",
  iban: "DE64 3002 0900 5321 0926 15",
  bic: "CMCIDEDD",
} as const;

/** Branding block lines (name, legal entity, address, tax, contact). */
export function pdfCompanyBrandingLines(): readonly string[] {
  return [
    PDF_COMPANY.name,
    `${PDF_COMPANY.legalOwner} (${PDF_COMPANY.legalForm})`,
    PDF_COMPANY.addressLine,
    `Steuernummer: ${PDF_COMPANY.taxNumber}`,
    `E-Mail: ${PDF_COMPANY.email}`,
    `Tel: ${PDF_COMPANY.phone}`,
    PDF_COMPANY.website,
  ];
}

/** Compact footer for PDFs. */
export function pdfCompanyFooterLine(): string {
  return `${PDF_COMPANY.legalOwner} | ${PDF_COMPANY.addressLine} | Steuernr. ${PDF_COMPANY.taxNumber} | ${PDF_COMPANY.website} | ${PDF_COMPANY.email} | ${PDF_COMPANY.phone}`;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com";

import { INVOICE_LOGO_PNG_BASE64 } from "./invoice-logo-png";

/** Load logo for PDFs. Prefer the bundled PNG so deploys never keep a stale CDN/env file. */
export async function getPdfLogoBytes(): Promise<Uint8Array | null> {
  try {
    if (INVOICE_LOGO_PNG_BASE64) {
      return new Uint8Array(Buffer.from(INVOICE_LOGO_PNG_BASE64, "base64"));
    }
  } catch {
    /* fallback */
  }
  try {
    const { existsSync, readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const local = join(process.cwd(), "public", "invoice-logo.png");
    if (existsSync(local)) {
      return new Uint8Array(readFileSync(local));
    }
  } catch {
    /* fallback */
  }
  try {
    const res = await fetch(`${SITE_URL}/invoice-logo.png?v=20260916c`);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    }
  } catch {
    /* no logo */
  }
  return null;
}
