/** Parse JSON from fetch; if body is HTML/text (e.g. Vercel 413), throw a readable error. */
export async function parseFetchJson<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const snippet = text.replace(/\s+/g, " ").slice(0, 180);
    if (/request entity too large|413|payload too large/i.test(text)) {
      throw new Error(
        "Datei zu groß für den Server-Upload (Vercel-Limit). Bitte kleinere Bilder nutzen oder YouTube-Link für Videos.",
      );
    }
    throw new Error(snippet || `Ungültige Antwort (${res.status})`);
  }
}
