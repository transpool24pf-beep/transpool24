/** Full consignee/pickup address in the inTime split-field shape. */

export type StructuredAddress = {
  company: string;
  phone: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  notes: string;
};

export const EMPTY_STRUCTURED_ADDRESS: StructuredAddress = {
  company: "",
  phone: "",
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
    phone: str("phone"),
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

export type AddressNotesKind = "load" | "unload";

export function addressNotesLabel(kind: AddressNotesKind): string {
  return kind === "unload" ? "Hinweise Entladestelle" : "Hinweise Ladestelle";
}

/** Site notes only (empty if the customer left the field blank). */
export function structuredAddressNotes(a: StructuredAddress): string {
  return a.notes.trim();
}

export function formatStructuredAddressPlain(
  a: StructuredAddress,
  notesKind: AddressNotesKind | false = "load"
): string {
  const lines: string[] = [];
  if (a.company.trim()) lines.push(a.company.trim());
  if (a.phone.trim()) lines.push(a.phone.trim());
  const street = `${a.street.trim()} ${a.houseNumber.trim()}`.trim();
  if (street) lines.push(street);
  const plzOrt = `${a.postalCode.trim()} ${a.city.trim()}`.trim();
  if (plzOrt) lines.push(plzOrt);
  if (a.country.trim()) lines.push(a.country.trim());
  if (notesKind !== false && a.notes.trim()) {
    lines.push(`${addressNotesLabel(notesKind)}: ${a.notes.trim()}`);
  }
  return lines.join("\n");
}

export function formatStructuredAddressHtml(
  a: StructuredAddress,
  escapeHtml: (s: string) => string,
  notesKind: AddressNotesKind | false = "load"
): string {
  const parts: string[] = [];
  if (a.company.trim()) parts.push(escapeHtml(a.company.trim()));
  if (a.phone.trim()) parts.push(escapeHtml(a.phone.trim()));
  const street = `${a.street.trim()} ${a.houseNumber.trim()}`.trim();
  if (street) parts.push(escapeHtml(street));
  const plzOrt = `${a.postalCode.trim()} ${a.city.trim()}`.trim();
  if (plzOrt) parts.push(escapeHtml(plzOrt));
  if (a.country.trim()) parts.push(escapeHtml(a.country.trim()));
  if (notesKind !== false && a.notes.trim()) {
    parts.push(`<strong>${escapeHtml(addressNotesLabel(notesKind))}:</strong> ${escapeHtml(a.notes.trim())}`);
  }
  return parts.join("<br />");
}

export function splitStreetHouse(streetPart: string): { street: string; houseNumber: string } {
  const s = streetPart.trim().replace(/,$/, "");
  const m = s.match(/^(.*\S)\s+(\d+[a-zA-Z]?(?:\/\d+[a-zA-Z]?)?)$/);
  if (m) return { street: m[1].trim(), houseNumber: m[2].trim() };
  return { street: s, houseNumber: "" };
}

const DE_ADDRESS_META =
  /^(deutschland|germany|de|baden-w(?:ü|u)rttemberg|bayern|hessen|nordrhein-westfalen|nrw|rheinland-pfalz|saarland|sachsen(?:-anhalt)?|niedersachsen|schleswig-holstein|thüringen|thuringen|brandenburg|mecklenburg(?:-vorpommern)?|europa|europe)$/i;

const DE_ADMIN_AREA =
  /^(landkreis|kreis|regierungsbezirk)\b/i;

function isGermanAddressMeta(part: string): boolean {
  const p = part.trim();
  if (!p) return true;
  if (/^\d{5}$/.test(p)) return true;
  if (DE_ADMIN_AREA.test(p)) return true;
  return DE_ADDRESS_META.test(p);
}

export function looksLikeStreetName(value: string): boolean {
  const s = value.trim();
  if (s.length < 2) return false;
  if (/\d/.test(s)) return true;
  return /\b(straße|strasse|str\.|weg|platz|ring|allee|gasse|damm|chaussee|pfad|steig|ufer)\b/i.test(s);
}

function cityFromAddressParts(parts: string[], plz: string, skip: string): string {
  const skipN = skip.trim().toLowerCase();
  const expanded: string[] = [];
  for (const part of parts) {
    const m = part.match(new RegExp(`^${plz}\\s+(.+)$`));
    if (m?.[1]) expanded.push(m[1].trim());
    else if (part !== plz && !part.startsWith(`${plz} `)) expanded.push(part);
  }
  return (
    expanded.find((p) => {
      if (isGermanAddressMeta(p) || !/[A-Za-zÄÖÜäöüß]/.test(p)) return false;
      if (skipN && p.trim().toLowerCase() === skipN) return false;
      if (looksLikeStreetName(p) && /\d/.test(p)) return false;
      return true;
    }) ?? ""
  );
}

/** Best-effort parse of a one-line German address into structured fields. */
export function parseStructuredAddressFromLine(line: string): StructuredAddress {
  const t = (line ?? "").trim();
  const base = { ...EMPTY_STRUCTURED_ADDRESS };
  if (!t) return base;
  const cleaned = t.replace(/,?\s*(Deutschland|Germany|DE)\s*$/i, "").trim();
  const parts = cleaned.split(",").map((p) => p.trim()).filter(Boolean);
  const plzInLine = cleaned.match(/\b(\d{5})\b/)?.[1] ?? "";

  const streetSource =
    parts.find((p) => looksLikeStreetName(p) && !/^\d{5}/.test(p)) ||
    parts.find((p) => !isGermanAddressMeta(p) && !/^\d{5}/.test(p)) ||
    parts[0] ||
    cleaned;

  const split = splitStreetHouse(streetSource);
  let city = "";
  if (plzInLine) {
    const plzIdx = parts.findIndex((p) => p === plzInLine || p.startsWith(`${plzInLine} `));
    const beforeParts = plzIdx >= 0 ? parts.slice(0, plzIdx) : parts;
    const afterParts = plzIdx >= 0 ? parts.slice(plzIdx) : [];
    city = cityFromAddressParts([...afterParts, ...beforeParts.slice().reverse()], plzInLine, streetSource);
  }
  if (!city) {
    city =
      parts
        .slice()
        .reverse()
        .find((p) => {
          if (p === streetSource || isGermanAddressMeta(p) || /^\d{5}/.test(p)) return false;
          if (looksLikeStreetName(p) && /\d/.test(p)) return false;
          return /[A-Za-zÄÖÜäöüß]/.test(p);
        }) ?? "";
  }

  return {
    ...base,
    street: split.street,
    houseNumber: split.houseNumber,
    postalCode: plzInLine,
    city,
    country: "Deutschland",
  };
}

type JobLike = {
  pickup_address?: string | null;
  pickup_city?: string | null;
  delivery_address?: string | null;
  delivery_city?: string | null;
  company_name?: string | null;
  preferred_delivery_at?: string | null;
  cargo_details?: Record<string, unknown> | null;
};

function fromDetails(details: Record<string, unknown> | null | undefined, key: string, fallbackLine: string): StructuredAddress {
  const parsed = normalizeStructuredAddress(details?.[key]);
  if (isStructuredAddressComplete(parsed) || parsed.street) {
    return parsed;
  }
  const fromLine = parseStructuredAddressFromLine(fallbackLine);
  if (parsed.notes || parsed.company || parsed.phone) {
    return {
      ...fromLine,
      company: parsed.company || fromLine.company,
      phone: parsed.phone || fromLine.phone,
      notes: parsed.notes || fromLine.notes,
    };
  }
  return fromLine;
}

export function jobPreferredDeliveryAt(job: JobLike): string | null {
  if (typeof job.preferred_delivery_at === "string" && job.preferred_delivery_at.trim()) {
    return job.preferred_delivery_at;
  }
  const raw = job.cargo_details?.preferred_delivery_at;
  return typeof raw === "string" && raw.trim() ? raw : null;
}

export function jobSenderAddress(job: JobLike): StructuredAddress {
  const line = `${job.pickup_address ?? ""}${job.pickup_city ? `, ${job.pickup_city}` : ""}`;
  const parsed = fromDetails(job.cargo_details ?? null, "senderAddress", line);
  const bookingCompany = job.company_name?.trim() || "";
  return { ...parsed, company: bookingCompany || parsed.company };
}

export function jobRecipientAddress(job: JobLike): StructuredAddress {
  const line = `${job.delivery_address ?? ""}${job.delivery_city ? `, ${job.delivery_city}` : ""}`;
  return fromDetails(job.cargo_details ?? null, "recipientAddress", line);
}
