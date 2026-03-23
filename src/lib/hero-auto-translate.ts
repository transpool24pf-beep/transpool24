import type { Locale } from "@/i18n/routing";
import { locales } from "@/i18n/routing";

type Triple = [string, string, string];

/** DeepL `target_lang` (Pro/Free API). Kurdish not supported → null. */
function deeplTarget(loc: Locale): string | null {
  const m: Partial<Record<Locale, string>> = {
    de: "DE",
    tr: "TR",
    fr: "FR",
    es: "ES",
    ar: "AR",
    ru: "RU",
    pl: "PL",
    ro: "RO",
    it: "IT",
    uk: "UK",
  };
  return m[loc] ?? null;
}

function googleTarget(loc: Locale): string {
  const m: Record<Locale, string> = {
    de: "de",
    en: "en",
    tr: "tr",
    fr: "fr",
    es: "es",
    ar: "ar",
    ru: "ru",
    pl: "pl",
    ro: "ro",
    ku: "ku",
    it: "it",
    uk: "uk",
  };
  return m[loc];
}

async function translateTripleDeepL(a: string, b: string, c: string, loc: Locale): Promise<Triple | null> {
  const key = process.env.DEEPL_AUTH_KEY;
  const tgt = deeplTarget(loc);
  if (!key || !tgt) return null;

  const raw = [a, b, c].map((s) => s.trim());
  const params = new URLSearchParams();
  params.append("auth_key", key);
  params.append("source_lang", "EN");
  params.append("target_lang", tgt);
  for (const p of raw) {
    params.append("text", p.length ? p : " ");
  }

  const host =
    process.env.DEEPL_USE_PRO === "true" ? "https://api.deepl.com" : "https://api-free.deepl.com";
  const res = await fetch(`${host}/v2/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { translations?: { text: string }[] };
  const tr = j.translations;
  if (!tr || tr.length !== 3) return null;
  return [
    raw[0] ? tr[0].text.trim() : "",
    raw[1] ? tr[1].text.trim() : "",
    raw[2] ? tr[2].text.trim() : "",
  ];
}

async function translateOneGoogle(text: string, target: string): Promise<string> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  const t = text.trim();
  if (!t) return "";
  if (!key) return t;
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: t, source: "en", target, format: "text" }),
      cache: "no-store",
    },
  );
  if (!res.ok) return t;
  const j = (await res.json()) as { data?: { translations?: { translatedText?: string }[] } };
  const out = j.data?.translations?.[0]?.translatedText;
  return typeof out === "string" ? out : t;
}

async function translateTripleGoogle(a: string, b: string, c: string, loc: Locale): Promise<Triple | null> {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) return null;
  const tgt = googleTarget(loc);
  if (loc === "en") return [a.trim(), b.trim(), c.trim()];
  const [x, y, z] = await Promise.all([
    translateOneGoogle(a, tgt),
    translateOneGoogle(b, tgt),
    translateOneGoogle(c, tgt),
  ]);
  return [x, y, z];
}

async function translateOneMyMemory(text: string, target: string): Promise<string> {
  const t = text.trim();
  if (!t) return "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=en|${target}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return t;
  const j = (await res.json()) as { responseData?: { translatedText?: string } };
  const out = j.responseData?.translatedText;
  if (typeof out !== "string") return t;
  if (out.includes("MYMEMORY WARNING")) return t;
  return out;
}

async function translateTripleMyMemory(a: string, b: string, c: string, loc: Locale): Promise<Triple> {
  const tgt = googleTarget(loc);
  if (loc === "en") return [a.trim(), b.trim(), c.trim()];
  const [x, y, z] = await Promise.all([
    translateOneMyMemory(a, tgt),
    translateOneMyMemory(b, tgt),
    translateOneMyMemory(c, tgt),
  ]);
  return [x, y, z];
}

async function translateTripleForLocale(a: string, b: string, c: string, loc: Locale): Promise<Triple> {
  if (loc === "en") return [a.trim(), b.trim(), c.trim()];
  const d = await translateTripleDeepL(a, b, c, loc);
  if (d) return d;
  const g = await translateTripleGoogle(a, b, c, loc);
  if (g) return g;
  const m = await translateTripleMyMemory(a, b, c, loc);
  return m;
}

/**
 * Builds per-locale hero payload from a single English source.
 * Order: DeepL (if DEEPL_AUTH_KEY) → Google (if GOOGLE_TRANSLATE_API_KEY) → MyMemory → copy English.
 */
export async function translateHeroFromEnglish(
  headline: string,
  subtitle: string,
  cta: string,
): Promise<{
  headline: Record<string, string>;
  subtitle: Record<string, string>;
  cta: Record<string, string>;
}> {
  const hOut: Record<string, string> = {};
  const sOut: Record<string, string> = {};
  const cOut: Record<string, string> = {};

  if (!headline.trim() && !subtitle.trim() && !cta.trim()) {
    return { headline: {}, subtitle: {}, cta: {} };
  }

  await Promise.all(
    locales.map(async (loc) => {
      const [th, ts, tc] = await translateTripleForLocale(headline, subtitle, cta, loc);
      hOut[loc] = th;
      sOut[loc] = ts;
      cOut[loc] = tc;
    }),
  );

  return { headline: hOut, subtitle: sOut, cta: cOut };
}
