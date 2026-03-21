/** Dial codes for WhatsApp / E.164-style storage (digits only, no +). */
export type DialEntry = { iso: string; dial: string; flag: string };

export const DIAL_CODES: DialEntry[] = [
  { iso: "DE", dial: "49", flag: "🇩🇪" },
  { iso: "AT", dial: "43", flag: "🇦🇹" },
  { iso: "CH", dial: "41", flag: "🇨🇭" },
  { iso: "FR", dial: "33", flag: "🇫🇷" },
  { iso: "NL", dial: "31", flag: "🇳🇱" },
  { iso: "BE", dial: "32", flag: "🇧🇪" },
  { iso: "LU", dial: "352", flag: "🇱🇺" },
  { iso: "GB", dial: "44", flag: "🇬🇧" },
  { iso: "IE", dial: "353", flag: "🇮🇪" },
  { iso: "ES", dial: "34", flag: "🇪🇸" },
  { iso: "IT", dial: "39", flag: "🇮🇹" },
  { iso: "PT", dial: "351", flag: "🇵🇹" },
  { iso: "PL", dial: "48", flag: "🇵🇱" },
  { iso: "CZ", dial: "420", flag: "🇨🇿" },
  { iso: "SE", dial: "46", flag: "🇸🇪" },
  { iso: "NO", dial: "47", flag: "🇳🇴" },
  { iso: "DK", dial: "45", flag: "🇩🇰" },
  { iso: "FI", dial: "358", flag: "🇫🇮" },
  { iso: "GR", dial: "30", flag: "🇬🇷" },
  { iso: "TR", dial: "90", flag: "🇹🇷" },
  { iso: "SA", dial: "966", flag: "🇸🇦" },
  { iso: "AE", dial: "971", flag: "🇦🇪" },
  { iso: "EG", dial: "20", flag: "🇪🇬" },
  { iso: "US", dial: "1", flag: "🇺🇸" },
  { iso: "CA", dial: "1", flag: "🇨🇦" },
];

export function buildPhoneE164(dial: string, nationalDigits: string): string | null {
  const d = dial.replace(/\D/g, "");
  let n = nationalDigits.replace(/\D/g, "");
  if (!d || n.length < 6) return null;
  if (n.startsWith("0")) n = n.replace(/^0+/, "");
  if (!n) return null;
  return `${d}${n}`;
}

export function whatsappHrefFromE164(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}
