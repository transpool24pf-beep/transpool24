import {
  BOOKKEEPING_CATEGORIES,
  eurosToCents,
  isBookkeepingCategory,
  type BookkeepingCategory,
} from "@/lib/bookkeeping";

export type OcrExtract = {
  vendor_name: string | null;
  document_date: string | null;
  invoice_number: string | null;
  gross_cents: number | null;
  net_cents: number | null;
  vat_cents: number | null;
  vat_rate: number | null;
  currency: string;
  category: BookkeepingCategory;
  notes: string | null;
  raw: Record<string, unknown>;
};

function ymd(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const de = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (de) {
    return `${de[3]}-${de[2].padStart(2, "0")}-${de[1].padStart(2, "0")}`;
  }
  return null;
}

export function parseOcrPayload(raw: Record<string, unknown>): OcrExtract {
  const categoryRaw = typeof raw.category === "string" ? raw.category.trim().toLowerCase() : "";
  const category: BookkeepingCategory = isBookkeepingCategory(categoryRaw)
    ? categoryRaw
    : "sonstiges";
  const vatRate =
    typeof raw.vat_rate === "number" && Number.isFinite(raw.vat_rate)
      ? raw.vat_rate
      : typeof raw.vat_rate === "string"
        ? Number(String(raw.vat_rate).replace(",", "."))
        : null;
  return {
    vendor_name: typeof raw.vendor_name === "string" ? raw.vendor_name.trim() || null : null,
    document_date: ymd(raw.document_date),
    invoice_number: typeof raw.invoice_number === "string" ? raw.invoice_number.trim() || null : null,
    gross_cents: eurosToCents(raw.gross_eur),
    net_cents: eurosToCents(raw.net_eur),
    vat_cents: eurosToCents(raw.vat_eur),
    vat_rate: vatRate != null && Number.isFinite(vatRate) ? vatRate : null,
    currency: typeof raw.currency === "string" && raw.currency.trim() ? raw.currency.trim() : "EUR",
    category,
    notes: typeof raw.notes === "string" ? raw.notes.trim() || null : null,
    raw,
  };
}

export async function extractReceiptWithAi(input: {
  mimeType: string;
  bytes: Buffer;
}): Promise<{ status: "done" | "skipped" | "failed"; extract: OcrExtract | null; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { status: "skipped", extract: null };
  }
  if (!input.mimeType.startsWith("image/")) {
    return { status: "skipped", extract: null };
  }

  const b64 = input.bytes.toString("base64");
  const prompt = `Du liest deutsche Kassenbons und Rechnungen (Tankstelle, Werkstatt, Maut, Büro).
Antworte NUR mit JSON, ohne Markdown:
{
  "vendor_name": "string",
  "document_date": "YYYY-MM-DD",
  "invoice_number": "string or empty",
  "gross_eur": 12.34,
  "net_eur": 10.37,
  "vat_eur": 1.97,
  "vat_rate": 19,
  "currency": "EUR",
  "category": "${BOOKKEEPING_CATEGORIES.join("|")}",
  "notes": "kurz, Deutsch"
}
Beträge als Zahlen. Datum ISO. category nur aus der Liste.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_BOOKKEEPING_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${input.mimeType};base64,${b64}`,
                },
              },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { status: "failed", extract: null, error: text.slice(0, 400) };
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return { status: "done", extract: parseOcrPayload(parsed) };
  } catch (e) {
    return {
      status: "failed",
      extract: null,
      error: e instanceof Error ? e.message : "OCR failed",
    };
  }
}
