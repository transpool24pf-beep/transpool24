/** Full consignee/pickup address in the inTime split-field shape. */

export type StructuredAddress = {
  company: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  notes: string;
};

export const EMPTY_STRUCTURED_ADDRESS: StructuredAddress = {
  company: "",
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  country: "Deutschland",
  notes: "",
};

export function normalizeStructuredAddress(raw: unknown): StructuredAddress {
  if (!raw || typeof raw !== "object") return { ...EMPTY_STRUCTURED_ADDRESS };
  const o = raw as Record<string, unknown>;
  const str = (k: string) => (typeof o[k] === "string" ? o[k].trim() : "");
  return {
    company: str("company"),
    street: str("street"),
    houseNumber: str("houseNumber"),
    postalCode: str("postalCode").replace(/\D/g, "").slice(0, 5),
    city: str("city"),
    country: str("country") || "Deutschland",
    notes: str("notes"),
  };
}

export function isStructuredAddressComplete(a: StructuredAddress): boolean {
  return (
    a.street.trim().length >= 2 &&
    a.houseNumber.trim().length >= 1 &&
    /^\d{5}$/.test(a.postalCode.trim()) &&
    a.city.trim().length >= 2
  );
}

export function formatStructuredAddressLine(a: StructuredAddress): string {
  const street = `${a.street.trim()} ${a.houseNumber.trim()}`.trim();
  const plzOrt = `${a.postalCode.trim()} ${a.city.trim()}`.trim();
  const country = (a.country.trim() || "Deutschland").trim();
  return [street, plzOrt, country].filter(Boolean).join(", ");
}

export function formatStructuredAddressPlain(a: StructuredAddress): string {
  const lines: string[] = [];
  if (a.company.trim()) lines.push(a.company.trim());
  const street = `${a.street.trim()} ${a.houseNumber.trim()}`.trim();
  if (street) lines.push(street);
  const plzOrt = `${a.postalCode.trim()} ${a.city.trim()}`.trim();
  if (plzOrt) lines.push(plzOrt);
  if (a.country.trim()) lines.push(a.country.trim());
  if (a.notes.trim()) lines.push(a.notes.trim());
  return lines.join("\n");
}

export function formatStructuredAddressHtml(a: StructuredAddress, escapeHtml: (s: string) => string): string {
  const parts: string[] = [];
  if (a.company.trim()) parts.push(escapeHtml(a.company.trim()));
  const street = `${a.street.trim()} ${a.houseNumber.trim()}`.trim();
  if (street) parts.push(escapeHtml(street));
  const plzOrt = `${a.postalCode.trim()} ${a.city.trim()}`.trim();
  if (plzOrt) parts.push(escapeHtml(plzOrt));
  if (a.country.trim()) parts.push(escapeHtml(a.country.trim()));
  if (a.notes.trim()) parts.push(escapeHtml(a.notes.trim()));
  return parts.join("<br />");
}

/** Best-effort parse of a one-line German address into structured fields. */
export function parseStructuredAddressFromLine(line: string): StructuredAddress {
  const t = (line ?? "").trim();
  const base = { ...EMPTY_STRUCTURED_ADDRESS };
  if (!t) return base;
  const cleaned = t.replace(/,?\s*Deutschland\s*$/i, "").trim();
  const m = cleaned.match(/^(.*?)[,\s]+(\d{5})\s+(.+)$/);
  if (m) {
    const streetPart = m[1].trim().replace(/,$/, "");
    const hn = streetPart.match(/^(.*\S)\s+(\d+\s*[a-zA-Z]?)$/);
    return {
      ...base,
      street: hn ? hn[1].trim() : streetPart,
      houseNumber: hn ? hn[2].trim() : "",
      postalCode: m[2],
      city: m[3].trim().replace(/,$/, ""),
      country: "Deutschland",
    };
  }
  return { ...base, street: cleaned };
}

type JobLike = {
  pickup_address?: string | null;
  pickup_city?: string | null;
  delivery_address?: string | null;
  delivery_city?: string | null;
  company_name?: string | null;
  cargo_details?: Record<string, unknown> | null;
};

function fromDetails(details: Record<string, unknown> | null | undefined, key: string, fallbackLine: string): StructuredAddress {
  const parsed = normalizeStructuredAddress(details?.[key]);
  if (isStructuredAddressComplete(parsed) || parsed.street) return parsed;
  return parseStructuredAddressFromLine(fallbackLine);
}

export function jobSenderAddress(job: JobLike): StructuredAddress {
  const line = `${job.pickup_address ?? ""}${job.pickup_city ? `, ${job.pickup_city}` : ""}`;
  return fromDetails(job.cargo_details ?? null, "senderAddress", line);
}

export function jobRecipientAddress(job: JobLike): StructuredAddress {
  const line = `${job.delivery_address ?? ""}${job.delivery_city ? `, ${job.delivery_city}` : ""}`;
  const parsed = fromDetails(job.cargo_details ?? null, "recipientAddress", line);
  if (!parsed.company.trim() && job.company_name?.trim()) {
    return { ...parsed, company: job.company_name.trim() };
  }
  return parsed;
}
