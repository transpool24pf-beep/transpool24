import type { Locale } from "@/i18n/routing";
import { locales } from "@/i18n/routing";

export type SourcePostFields = {
  title: string;
  excerpt: string | null;
  body: string;
  meta_title: string | null;
  meta_description: string | null;
  category: string | null;
  tags: string[];
};

export type TranslatedPostFields = {
  title: string;
  excerpt: string | null;
  body: string;
  meta_title: string | null;
  meta_description: string | null;
  category: string | null;
  tags: string[];
};

const BODY_CHAR_SOFT_LIMIT = 10_000;

function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Translates one blog post into several target locales via OpenAI (gpt-4o-mini).
 * Requires OPENAI_API_KEY. Batches targets to reduce payload size and timeouts.
 */
export async function translatePostIntoLocales(
  source: SourcePostFields,
  sourceLocale: Locale,
  targetLocales: readonly Locale[],
  apiKey: string
): Promise<Partial<Record<Locale, TranslatedPostFields>>> {
  const body =
    source.body.length > BODY_CHAR_SOFT_LIMIT
      ? `${source.body.slice(0, BODY_CHAR_SOFT_LIMIT)}\n\n<!-- source truncated for translation pass; extend in admin if needed -->`
      : source.body;

  const payload = {
    source_locale: sourceLocale,
    title: source.title,
    excerpt: source.excerpt,
    body,
    body_was_truncated: source.body.length > BODY_CHAR_SOFT_LIMIT,
    meta_title: source.meta_title,
    meta_description: source.meta_description,
    category: source.category,
    tags: source.tags,
  };

  const merged: Partial<Record<Locale, TranslatedPostFields>> = {};
  const batches = chunk(targetLocales, 3);

  for (const batch of batches) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.25,
        max_tokens: 16384,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a professional translator for a logistics magazine. You receive JSON with a blog post in locale "${sourceLocale}".
Return ONLY valid JSON with this shape:
{ "byLocale": { "<locale_code>": { "title": string, "excerpt": string|null, "body": string, "meta_title": string|null, "meta_description": string|null, "category": string|null, "tags": string[] } } }
Rules:
- Include exactly one entry per target locale in this request: ${batch.join(", ")}.
- "body" must be Markdown; preserve headings, lists, blockquotes, and bold.
- Localize in-link paths when they are locale-prefixed site links (e.g. /en/foo → /de/foo for German).
- Translate tags and category naturally for each language.
- Keep proper names (TransPool24, Pforzheim) as appropriate.`,
          },
          {
            role: "user",
            content: JSON.stringify({ ...payload, target_locales: batch }),
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[blog-translate] OpenAI error", res.status, errText.slice(0, 500));
      continue;
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as {
        byLocale?: Record<string, TranslatedPostFields>;
      };
      const by = parsed.byLocale ?? {};
      for (const loc of batch) {
        const row = by[loc];
        if (row?.title && typeof row.body === "string") {
          merged[loc] = {
            title: row.title,
            excerpt: row.excerpt ?? null,
            body: row.body,
            meta_title: row.meta_title ?? null,
            meta_description: row.meta_description ?? null,
            category: row.category ?? null,
            tags: Array.isArray(row.tags) ? row.tags.map(String) : source.tags,
          };
        }
      }
    } catch (e) {
      console.error("[blog-translate] JSON parse", e);
    }
  }

  return merged;
}

export function otherLocalesThan(source: Locale): Locale[] {
  return locales.filter((l) => l !== source);
}

export type BlogCardSourceFields = {
  title: string;
  excerpt: string | null;
  category: string | null;
  tags: string[];
};

/**
 * Lightweight translation for listing cards when no row exists for the URL locale.
 */
export async function translateBlogCardFields(
  source: BlogCardSourceFields,
  sourceLocale: Locale,
  targetLocale: Locale,
  apiKey: string
): Promise<BlogCardSourceFields | null> {
  if (sourceLocale === targetLocale) return source;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.25,
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You translate short blog listing fields for a logistics magazine. Return ONLY JSON:
{ "title": string, "excerpt": string|null, "category": string|null, "tags": string[] }
Translate from ${sourceLocale} to ${targetLocale}. Preserve meaning; keep TransPool24 and place names sensible.`,
        },
        {
          role: "user",
          content: JSON.stringify({ ...source, source_locale: sourceLocale, target_locale: targetLocale }),
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[blog-translate] card OpenAI error", res.status, errText.slice(0, 400));
    return null;
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<BlogCardSourceFields>;
    return {
      title: typeof parsed.title === "string" ? parsed.title : source.title,
      excerpt: parsed.excerpt === undefined ? source.excerpt : parsed.excerpt,
      category: parsed.category === undefined ? source.category : parsed.category,
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : source.tags,
    };
  } catch (e) {
    console.error("[blog-translate] card JSON", e);
    return null;
  }
}
