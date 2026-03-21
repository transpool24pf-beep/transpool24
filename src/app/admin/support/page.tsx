"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { whatsappHrefFromE164 } from "@/lib/country-dial-codes";

type SupportRequest = {
  id: string;
  driver_number: number | null;
  name: string;
  email: string;
  message: string;
  created_at: string;
  requester_type?: string | null;
  customer_email?: string | null;
  job_id?: string | null;
  phone_e164?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  country?: string | null;
  inquiry_type?: string | null;
  comm_language?: string | null;
  page_locale?: string | null;
  privacy_accepted?: boolean | null;
  marketing_opt_in?: boolean | null;
  admin_reply?: string | null;
  driver_info: { full_name: string; phone: string; city: string; id: string } | null;
};

const INQUIRY_DE: Record<string, string> = {
  booking: "Buchung / Auftrag",
  driver: "Fahrer / Bewerbung",
  press: "Presse",
  partnership: "Partnerschaft",
  other: "Sonstiges",
};

const COMM_DE: Record<string, string> = {
  de: "Deutsch",
  en: "Englisch",
  ar: "Arabisch",
  tr: "Türkisch",
  fr: "Französisch",
  es: "Spanisch",
};

function waDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function resolveWhatsAppHref(req: SupportRequest): { href: string; label: string } | null {
  const e164 = req.phone_e164?.replace(/\D/g, "");
  if (e164 && e164.length >= 10) {
    return { href: whatsappHrefFromE164(e164), label: `+${e164}` };
  }
  const dPhone = req.driver_info?.phone;
  if (dPhone) {
    const d = waDigits(dPhone);
    if (d.length >= 10) return { href: `https://wa.me/${d}`, label: dPhone };
  }
  return null;
}

function SupportRequestCard({ req, onReplySaved }: { req: SupportRequest; onReplySaved: (id: string, text: string) => void }) {
  const [reply, setReply] = useState(req.admin_reply ?? "");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  useEffect(() => {
    setReply(req.admin_reply ?? "");
  }, [req.id, req.admin_reply]);

  const isDriver = req.requester_type === "driver" && req.driver_number != null;
  const wa = resolveWhatsAppHref(req);

  const saveReply = async () => {
    setSaveErr("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/support-requests/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_reply: reply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Speichern fehlgeschlagen");
      onReplySaved(req.id, reply);
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#0d2137]/10 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#0d2137]/50">
          {new Date(req.created_at).toLocaleString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <span
          className={`rounded-full px-3 py-0.5 text-xs font-bold ${
            isDriver ? "bg-[#e85d04]/15 text-[#c2410c]" : "bg-slate-100 text-slate-700"
          }`}
        >
          {isDriver ? "Fahrer" : "Kunde / Kontakt"}
        </span>
      </div>

      <div className="mb-4 rounded-lg border border-[#0d2137]/10 bg-[#f8fafc] p-4">
        <h3 className="mb-2 text-sm font-bold text-[#0d2137]">Absender</h3>
        <ul className="space-y-1 text-sm text-[#0d2137]/90">
          {isDriver && req.driver_number != null && (
            <li>
              <strong>Fahrernr.:</strong> #{String(req.driver_number).padStart(5, "0")}
            </li>
          )}
          <li>
            <strong>Name:</strong> {req.name}
          </li>
          <li>
            <strong>E-Mail:</strong>{" "}
            <a href={`mailto:${req.email}`} className="text-[#e85d04] hover:underline">
              {req.email}
            </a>
          </li>
          {wa && (
            <li className="!mt-3 list-none">
              <p className="text-sm text-[#0d2137]/80">
                <strong>WhatsApp:</strong> <span className="font-mono tabular-nums">{wa.label}</span>
              </p>
              <a
                href={wa.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#20bd5a]"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp öffnen
              </a>
            </li>
          )}
          {req.company && (
            <li>
              <strong>Firma:</strong> {req.company}
            </li>
          )}
          {req.country && (
            <li>
              <strong>Land:</strong> {req.country}
            </li>
          )}
          {req.inquiry_type && (
            <li>
              <strong>Anfrage:</strong> {INQUIRY_DE[req.inquiry_type] ?? req.inquiry_type}
            </li>
          )}
          {req.comm_language && (
            <li>
              <strong>Sprache:</strong> {COMM_DE[req.comm_language] ?? req.comm_language}
            </li>
          )}
          {req.page_locale && (
            <li>
              <strong>Formular-Sprache:</strong> {req.page_locale}
            </li>
          )}
          {req.driver_info?.city && (
            <li>
              <strong>Stadt (Fahrerakte):</strong> {req.driver_info.city}
            </li>
          )}
          <li className="text-xs text-[#0d2137]/60">
            Marketing OK: {req.marketing_opt_in ? "Ja" : "Nein"} · Datenschutz: {req.privacy_accepted ? "Ja" : "—"}
          </li>
        </ul>
        {req.driver_info?.id && (
          <Link
            href={`/admin/driver-applications/${req.driver_info.id}`}
            className="mt-2 inline-block text-sm font-medium text-[#e85d04] hover:underline"
          >
            Fahrerakte öffnen →
          </Link>
        )}
      </div>

      <div className="mb-4">
        <h3 className="mb-2 text-sm font-bold text-[#0d2137]">Nachricht</h3>
        <p className="whitespace-pre-wrap rounded-lg border border-[#0d2137]/10 bg-white p-4 text-[#0d2137]/90">{req.message}</p>
      </div>

      <div className="rounded-lg border border-[#0d2137]/10 bg-white p-4">
        <h3 className="mb-2 text-sm font-bold text-[#0d2137]">Interne Antwort / Notiz</h3>
        <p className="mb-2 text-xs text-[#0d2137]/55">Sichtbar im Admin; optional für Ihr Team (kein Auto-Versand an Kunden).</p>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-lg border border-[#0d2137]/15 px-3 py-2 text-sm text-[#0d2137] focus:border-[#e85d04] focus:outline-none focus:ring-1 focus:ring-[#e85d04]"
          placeholder="Antwort oder Status notieren…"
        />
        {saveErr && <p className="mt-2 text-sm text-red-600">{saveErr}</p>}
        <button
          type="button"
          onClick={saveReply}
          disabled={saving}
          className="mt-3 rounded-lg bg-[#0d2137] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d2137]/90 disabled:opacity-50"
        >
          {saving ? "Speichern…" : "Antwort speichern"}
        </button>
      </div>
    </div>
  );
}

export default function AdminSupportPage() {
  const [list, setList] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetch("/api/admin/support-requests")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Fehler beim Laden");
        if (Array.isArray(data)) return data;
        if (data?.error) throw new Error(data.error);
        return [];
      })
      .then(setList)
      .catch((e) =>
        setError(
          e instanceof Error
            ? e.message
            : "Tabelle support_requests fehlt oder Spalten nicht migriert. supabase/support_requests.sql und support_requests_contact_enhancement.sql ausführen.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onReplySaved = useCallback((id: string, text: string) => {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, admin_reply: text } : r)));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2137]">Support-Nachrichten</h1>
          <p className="mt-1 text-sm text-[#0d2137]/60">
            Kontaktformular (Kunden) und Fahrer-Support. WhatsApp öffnen, interne Antwort speichern.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/de/support"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[#e85d04] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
          >
            Kontaktformular (Website)
          </Link>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-[#0d2137]/20 bg-white px-4 py-2 text-sm font-medium text-[#0d2137] hover:bg-[#f8fafc]"
          >
            Aktualisieren
          </button>
        </div>
      </div>

      {loading && <p className="text-[#0d2137]/70">Laden…</p>}
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="font-medium">Nachrichten konnten nicht geladen werden</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}
      {!loading && !error && list.length === 0 && (
        <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 text-center">
          <p className="text-[#0d2137]/80">Noch keine Nachrichten.</p>
          <p className="mt-2 text-sm text-[#0d2137]/60">Einsendungen aus dem Kontaktformular erscheinen hier.</p>
        </div>
      )}
      {!loading && !error && list.length > 0 && (
        <div className="space-y-4">
          {list.map((req) => (
            <SupportRequestCard key={req.id} req={req} onReplySaved={onReplySaved} />
          ))}
        </div>
      )}
    </div>
  );
}
