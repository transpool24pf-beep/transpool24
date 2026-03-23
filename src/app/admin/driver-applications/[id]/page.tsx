"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { DRIVER_POLICY_LEGAL_REF } from "@/lib/driver-policy";

type DriverApp = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  status: string;
  driver_number: number | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_notes: string | null;
  rejection_image_urls: string[] | null;
  suspended_at: string | null;
  desired_note: string | null;
  star_rating: number | null;
  stats?: { jobs_count: number; total_paid_cents: number; customer_rating_avg: number | null };
  last_jobs?: Array<{
    id: string;
    order_number: number | null;
    created_at: string;
    logistics_status: string;
    pickup_address: string;
    delivery_address: string;
    company_name: string;
    driver_price_cents: number | null;
    customer_driver_rating: number | null;
    customer_driver_comment: string | null;
  }>;
  service_policy_accepted: boolean;
  id_document_url: string | null;
  id_document_front_url: string | null;
  id_document_back_url: string | null;
  license_front_url: string | null;
  license_back_url: string | null;
  tax_or_commercial_number: string | null;
  personal_photo_url: string | null;
  languages_spoken: string | null;
  vehicle_plate: string | null;
  vehicle_documents_url: string | null;
  vehicle_photo_url: string | null;
  work_policy_accepted: boolean;
  created_at: string;
  iban: string | null;
  bank_account_holder_name: string | null;
};

const UPLOAD_URL = "/api/driver-applications/upload";

export default function AdminDriverApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const [app, setApp] = useState<DriverApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectFiles, setRejectFiles] = useState<File[]>([]);
  const [desiredNoteEdit, setDesiredNoteEdit] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [paymentInvoiceModal, setPaymentInvoiceModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentTip, setPaymentTip] = useState("");
  const [sendingInvoiceEmail, setSendingInvoiceEmail] = useState(false);
  const [bankIban, setBankIban] = useState("");
  const [bankHolderName, setBankHolderName] = useState("");
  const [savingBank, setSavingBank] = useState(false);
  const [editingBank, setEditingBank] = useState(false);
  const [editingBankInModal, setEditingBankInModal] = useState(false);
  const [modalIban, setModalIban] = useState("");
  const [modalHolderName, setModalHolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchApp = () => {
    if (!id) return;
    fetch(`/api/admin/driver-applications/${id}`)
      .then((r) => r.json())
      .then((data) => setApp(data))
      .catch(() => setApp(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchApp();
  }, [id]);

  // Auto-save bank info when editing (debounced)
  const bankSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!editingBank || !id) return;
    bankSaveTimeoutRef.current = setTimeout(() => {
      bankSaveTimeoutRef.current = null;
      const ibanVal = bankIban.trim() || null;
      const holderVal = bankHolderName.trim() || null;
      fetch(`/api/admin/driver-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_bank_info",
          iban: ibanVal,
          bank_account_holder_name: holderVal,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.error) return;
          setApp((prev) => (prev ? { ...prev, iban: ibanVal, bank_account_holder_name: holderVal } : null));
        })
        .catch(() => {});
    }, 800);
    return () => {
      if (bankSaveTimeoutRef.current) clearTimeout(bankSaveTimeoutRef.current);
    };
  }, [editingBank, bankIban, bankHolderName, id]);

  const openWhatsApp = (text?: string) => {
    if (!app) return;
    const num = app.phone.replace(/\D/g, "");
    const msg = text
      ? encodeURIComponent(text)
      : "";
    window.open(`https://wa.me/${num}${msg ? `?text=${msg}` : ""}`, "_blank");
  };

  const handleApprove = () => {
    if (!id || !window.confirm("Bewerbung wirklich genehmigen?")) return;
    setActionLoading(true);
    fetch(`/api/admin/driver-applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          alert(data?.error || "Fehlgeschlagen");
          return;
        }
        fetchApp();
      })
      .catch(() => alert("Verbindungsfehler"))
      .finally(() => setActionLoading(false));
  };

  const handleRejectSubmit = async () => {
    const notes = rejectNotes.trim();
    if (!notes) {
      alert("Bitte Ablehnungsgrund (Notizen) eingeben.");
      return;
    }
    setActionLoading(true);
    const urls: string[] = [];
    for (const file of rejectFiles) {
      try {
        const dataUrl = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        const res = await fetch(UPLOAD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: dataUrl, filename: file.name }),
        });
        const json = await res.json();
        if (res.ok && json.url) urls.push(json.url);
      } catch {
        // skip failed upload
      }
    }
    try {
      const res = await fetch(`/api/admin/driver-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejection_notes: notes,
          rejection_image_urls: urls,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRejectModal(false);
        setRejectNotes("");
        setRejectFiles([]);
        fetchApp();
      } else {
        alert(data?.error || "Ablehnung fehlgeschlagen");
      }
    } catch {
      alert("Verbindungsfehler");
    } finally {
      setActionLoading(false);
    }
  };

  const addRejectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setRejectFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeRejectFile = (i: number) => {
    setRejectFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const statusLabel =
    app?.status === "new"
      ? "Neu"
      : app?.status === "approved"
        ? "Genehmigt"
        : app?.status === "rejected"
          ? "Abgelehnt"
          : app?.status || "";

  if (!id || loading) return <p className="text-[#0d2137]/70">Laden…</p>;
  if (!app) return <p className="text-[#0d2137]/70">Bewerbung nicht gefunden.</p>;

  const welcomeMessage =
    "Hallo, deine Bewerbung bei TransPool24 wurde genehmigt. Du wartest auf die erste Tour. Tritt der Fahrer-WhatsApp-Gruppe bei, um Aufträge zu erhalten.";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/driver-applications"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Fahrerbewerbungen
        </Link>
      </div>

      <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#0d2137]">Fahrerbewerbung: {app.full_name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#0d2137]/60">
          {new Date(app.created_at).toLocaleString("de-DE")} · Status: {statusLabel}
          {app.driver_number != null && (
            <span className="rounded bg-[var(--accent)]/15 px-2 py-0.5 font-medium text-[var(--accent)]">
              Fahrernr. #{String(app.driver_number).padStart(5, "0")}
            </span>
          )}
          {app.suspended_at && (
            <span className="rounded bg-red-100 px-2 py-0.5 font-medium text-red-700">Gesperrt bis auf Weiteres</span>
          )}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <p><strong>E-Mail:</strong> {app.email}</p>
          <p><strong>Telefon / WhatsApp:</strong> {app.phone}</p>
          <p><strong>Stadt:</strong> {app.city}</p>
          <p><strong>Steuer-/Handelsnr.:</strong> {app.tax_or_commercial_number || "—"}</p>
          <p><strong>Sprachen:</strong> {app.languages_spoken || "—"}</p>
          <p><strong>Kennzeichen:</strong> {app.vehicle_plate || "—"}</p>
        </div>

        <div className="mt-6 rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.03] p-4">
          <p className="mb-2 text-sm font-semibold text-[#0d2137]/80">Zustimmungen bei Bewerbung</p>
          <p className="mb-2 text-xs text-[#0d2137]/60">
            Stand der Richtlinien-Referenz (PDF/Archiv):{" "}
            <code className="rounded bg-[#0d2137]/10 px-1.5 py-0.5 font-mono text-[11px]">{DRIVER_POLICY_LEGAL_REF}</code>
          </p>
          <ul className="space-y-1.5 text-sm text-[#0d2137]/85">
            <li>
              <strong>WhatsApp-Kontakt (Schritt 1):</strong>{" "}
              {app.service_policy_accepted ? (
                <span className="text-emerald-700">Ja</span>
              ) : (
                <span className="text-amber-700">Nein / nicht erfasst</span>
              )}
            </li>
            <li>
              <strong>Arbeits-/Firmenrichtlinie (Schritt 4):</strong>{" "}
              {app.work_policy_accepted ? (
                <span className="text-emerald-700">Ja</span>
              ) : (
                <span className="text-amber-700">Nein / nicht erfasst</span>
              )}
            </li>
            <li>
              <strong>Einreichung (Zeitstempel):</strong> {new Date(app.created_at).toLocaleString("de-DE")}
            </li>
          </ul>
        </div>

        {app.status === "approved" && app.stats && (
          <div className="mt-6 rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.03] p-4">
            <p className="mb-2 text-sm font-semibold text-[#0d2137]/80">Leistungsstatistik</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span><strong>Aufträge:</strong> {app.stats.jobs_count}</span>
              <span><strong>Ausgezahlt gesamt:</strong> {(app.stats.total_paid_cents / 100).toFixed(2)} €</span>
              <span className="flex items-center gap-1">
                <strong>Kundenbewertung:</strong>
                {(app.stats.customer_rating_avg ?? app.star_rating) != null ? (
                  <span className="text-amber-500">
                    {"★".repeat(Math.round(app.stats.customer_rating_avg ?? app.star_rating ?? 0))}
                    {"☆".repeat(5 - Math.round(app.stats.customer_rating_avg ?? app.star_rating ?? 0))}
                    {" "}({(app.stats.customer_rating_avg ?? app.star_rating)?.toFixed(1)})
                  </span>
                ) : (
                  "—"
                )}
              </span>
              <span className="flex items-center gap-1">
                <strong>Manuell (Sterne):</strong>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={async () => {
                      const res = await fetch(`/api/admin/driver-applications/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "update_star_rating", star_rating: app.star_rating === n ? null : n }),
                      });
                      if (res.ok) fetchApp();
                    }}
                    className={`text-lg ${(app.star_rating ?? 0) >= n ? "text-amber-500" : "text-[#0d2137]/30"}`}
                  >
                    ★
                  </button>
                ))}
              </span>
            </div>
          </div>
        )}

        {app.status === "approved" && (
          <div className="mt-4">
            <p className="mb-1 text-sm font-semibold text-[#0d2137]/80">Gewünschte Vergütung (Notiz)</p>
            {desiredNoteEdit !== "" ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={desiredNoteEdit}
                  onChange={(e) => setDesiredNoteEdit(e.target.value)}
                  className="flex-1 rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                  placeholder="z. B. Stundenlohn oder Wunschbetrag…"
                />
                <button
                  type="button"
                  disabled={savingNote}
                  onClick={async () => {
                    setSavingNote(true);
                    try {
                      const res = await fetch(`/api/admin/driver-applications/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "update_desired_note", desired_note: desiredNoteEdit }),
                      });
                      if (res.ok) {
                        setApp((prev) => (prev ? { ...prev, desired_note: desiredNoteEdit } : null));
                        setDesiredNoteEdit("");
                      }
                    } finally {
                      setSavingNote(false);
                    }
                  }}
                  className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm text-white"
                >
                  Speichern
                </button>
                <button type="button" onClick={() => setDesiredNoteEdit("")} className="rounded-lg border px-3 py-2 text-sm">
                  Abbrechen
                </button>
              </div>
            ) : (
              <p className="text-sm text-[#0d2137]/70">
                {app.desired_note || "—"}
                <button
                  type="button"
                  onClick={() => setDesiredNoteEdit(app.desired_note ?? "")}
                  className="mr-2 text-[var(--accent)] hover:underline"
                >
                  Bearbeiten
                </button>
              </p>
            )}
          </div>
        )}

        {app.status === "approved" && (
          <div className="mt-6 rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.03] p-4">
            <p className="mb-2 text-sm font-semibold text-[#0d2137]/80">Bankdaten (IBAN)</p>
            <p className="mb-1 text-xs text-[#0d2137]/60">Für Überweisungen und Rechnungen. Kontoinhaber wie auf der Karte.</p>
            {editingBank ? (
              <div className="space-y-3">
                <p className="text-xs text-[#0d2137]/60">Speichert automatisch beim Tippen.</p>
                <div>
                  <label className="block text-xs font-medium text-[#0d2137]/80">IBAN</label>
                  <input
                    type="text"
                    value={bankIban}
                    onChange={(e) => setBankIban(e.target.value)}
                    placeholder="DE89 3704 0044 0532 0130 00"
                    className="mt-1 w-full max-w-md rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0d2137]/80">Kontoinhaber (wie auf der Karte)</label>
                  <input
                    type="text"
                    value={bankHolderName}
                    onChange={(e) => setBankHolderName(e.target.value)}
                    placeholder="Wisam Dandash"
                    className="mt-1 w-full max-w-md rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                  />
                </div>
                <button type="button" onClick={() => setEditingBank(false)} className="rounded-lg border px-3 py-2 text-sm">
                  Abbrechen
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-[#0d2137]/80">
                  IBAN: {app.iban || "—"} · Inhaber: {app.bank_account_holder_name || "—"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBankIban(app.iban ?? "");
                    setBankHolderName(app.bank_account_holder_name ?? "");
                    setEditingBank(true);
                  }}
                  className="text-sm text-[var(--accent)] hover:underline"
                >
                  {app.iban || app.bank_account_holder_name ? "Bearbeiten" : "Bankdaten hinzufügen"}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openWhatsApp()}
            className="rounded-lg bg-[#25D366]/10 px-4 py-2 text-sm font-medium text-[#25D366] hover:bg-[#25D366]/20"
          >
            WhatsApp
          </button>

          {app.status === "new" && (
            <>
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Genehmigen
              </button>
              <button
                type="button"
                onClick={() => setRejectModal(true)}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Ablehnen
              </button>
            </>
          )}

          {app.status === "approved" && (
            <>
              {app.driver_number == null && (
                <button
                  type="button"
                  onClick={async () => {
                    setActionLoading(true);
                    try {
                      const res = await fetch(`/api/admin/driver-applications/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "assign_number" }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        fetchApp();
                      } else {
                        alert(data?.error || "Fehlgeschlagen");
                      }
                    } catch {
                      alert("Verbindungsfehler");
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  Fahrernummer vergeben
                </button>
              )}
              <a
                href={`/api/admin/driver-applications/${id}/approval-pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Genehmigungs-PDF
              </a>
              <button
                type="button"
                onClick={() => {
                  setPaymentAmount("");
                  setPaymentTip("");
                  setEditingBankInModal(false);
                  setModalIban(app.iban ?? "");
                  setModalHolderName(app.bank_account_holder_name ?? "");
                  setPaymentInvoiceModal(true);
                }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Überweisungsrechnung (Betrag + Trinkgeld)
              </button>
              <button
                type="button"
                onClick={() => openWhatsApp(welcomeMessage)}
                className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:bg-[#25D366]/90"
              >
                Willkommen + Gruppe (WhatsApp)
              </button>
              <button
                type="button"
                disabled={emailSending || !app.email?.trim()}
                onClick={async () => {
                  setEmailSending(true);
                  try {
                    const res = await fetch("/api/admin/send-driver-approval-email", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ driver_application_id: id }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert("Genehmigungs-E-Mail gesendet.");
                    } else {
                      alert(data?.error ?? "Versand fehlgeschlagen");
                    }
                  } catch {
                    alert("Verbindungsfehler");
                  } finally {
                    setEmailSending(false);
                  }
                }}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {emailSending ? "Senden…" : "Genehmigungs-E-Mail senden"}
              </button>
              <p className="mt-1 text-xs text-gray-500">
                Falls kein Versand: Domain bei{" "}
                <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline">
                  resend.com/domains
                </a>{" "}
                verifizieren und Absender aus eigener Domain nutzen (z. B. info@transpool24.com).
              </p>
              {app.suspended_at ? (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={async () => {
                    if (!window.confirm("Sperre für diesen Fahrer aufheben?")) return;
                    setActionLoading(true);
                    try {
                      const res = await fetch(`/api/admin/driver-applications/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "unsuspend" }),
                      });
                      if (res.ok) fetchApp();
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  Sperre aufheben
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={async () => {
                    if (!window.confirm("Fahrer bis auf Weiteres sperren?")) return;
                    setActionLoading(true);
                    try {
                      const res = await fetch(`/api/admin/driver-applications/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "suspend" }),
                      });
                      if (res.ok) fetchApp();
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
                >
                  Fahrer sperren
                </button>
              )}
            </>
          )}

          {app.status === "rejected" && app.rejection_notes && (
            <div className="mt-4 w-full rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Ablehnungsgrund:</p>
              <p className="mt-1 text-sm text-amber-800 whitespace-pre-wrap">{app.rejection_notes}</p>
              {app.rejection_image_urls && app.rejection_image_urls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {app.rejection_image_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={url} alt="" className="h-24 w-24 rounded border object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">Dokumente & Fotos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(app.id_document_front_url || app.id_document_url) && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">Ausweis / Aufenthalt – Vorderseite</p>
              <a
                href={app.id_document_front_url || app.id_document_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border"
              >
                <img
                  src={app.id_document_front_url || app.id_document_url || ""}
                  alt=""
                  className="h-32 w-full object-cover"
                />
              </a>
            </div>
          )}
          {app.id_document_back_url && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">Ausweis / Aufenthalt – Rückseite</p>
              <a href={app.id_document_back_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                <img src={app.id_document_back_url} alt="" className="h-32 w-full object-cover" />
              </a>
            </div>
          )}
          {app.license_front_url && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">Führerschein – Vorderseite</p>
              <a href={app.license_front_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                <img src={app.license_front_url} alt="" className="h-32 w-full object-cover" />
              </a>
            </div>
          )}
          {app.license_back_url && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">Führerschein – Rückseite</p>
              <a href={app.license_back_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                <img src={app.license_back_url} alt="" className="h-32 w-full object-cover" />
              </a>
            </div>
          )}
          {app.personal_photo_url && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">Passfoto</p>
              <a href={app.personal_photo_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                <img src={app.personal_photo_url} alt="" className="h-32 w-full object-cover" />
              </a>
            </div>
          )}
          {app.vehicle_documents_url && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">Fahrzeugpapiere</p>
              <a href={app.vehicle_documents_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                {app.vehicle_documents_url.toLowerCase().endsWith(".pdf") ? (
                  <span className="flex h-32 items-center justify-center bg-[#0d2137]/5 text-sm">PDF</span>
                ) : (
                  <img src={app.vehicle_documents_url} alt="" className="h-32 w-full object-cover" />
                )}
              </a>
            </div>
          )}
          {app.vehicle_photo_url && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">Fahrzeugfoto</p>
              <a href={app.vehicle_photo_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                <img src={app.vehicle_photo_url} alt="" className="h-32 w-full object-cover" />
              </a>
            </div>
          )}
        </div>
      </div>

      {app.last_jobs && app.last_jobs.length > 0 && (
        <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">Letzte Aufträge</h2>
          <div className="space-y-3">
            {app.last_jobs.map((job) => (
              <Link
                key={job.id}
                href={`/admin/orders/${job.id}`}
                className="block rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.02] p-4 transition hover:bg-[#0d2137]/[0.05]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-[#0d2137]">
                    Auftrag #{job.order_number ?? job.id.slice(0, 8)}
                  </span>
                  <span className="text-sm text-[#0d2137]/70">
                    {new Date(job.created_at).toLocaleString("de-DE")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#0d2137]/80">
                  {job.company_name} · {String(job.pickup_address).slice(0, 40)}… → {String(job.delivery_address).slice(0, 40)}…
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-[#0d2137]/10 px-2 py-0.5">
                    {job.logistics_status === "delivered" ? "Zugestellt" : job.logistics_status === "in_transit" ? "Unterwegs" : job.logistics_status === "assigned" ? "Zugewiesen" : job.logistics_status}
                  </span>
                  {job.driver_price_cents != null && (
                    <span className="text-[var(--accent)]">{(job.driver_price_cents / 100).toFixed(2)} €</span>
                  )}
                  {job.customer_driver_rating != null && (
                    <span className="text-amber-600">★ {job.customer_driver_rating}</span>
                  )}
                  {job.customer_driver_comment && (
                    <p className="mt-1 w-full text-xs text-[#0d2137]/70 line-clamp-2">«{job.customer_driver_comment}»</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {app.last_jobs && app.last_jobs.length === 0 && app.status === "approved" && (
        <div className="rounded-xl border border-[#0d2137]/10 bg-[#0d2137]/[0.02] p-6">
          <p className="text-sm text-[#0d2137]/70">Noch keine Aufträge für diesen Fahrer. Nach Zuweisung aus der Auftragsliste erscheinen sie hier.</p>
        </div>
      )}

      {paymentInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#0d2137]">Überweisungsrechnung an Fahrer</h3>
            <p className="mt-1 text-sm text-[#0d2137]/70">
              Betrag und optional Trinkgeld. PDF im IONOS-Stil mit IBAN und Kontoinhaber.
            </p>
            <div className="mt-4 rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.03] p-3">
              <p className="mb-1 text-xs font-semibold text-[#0d2137]/80">Bankdaten (im PDF)</p>
              {editingBankInModal ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={modalIban}
                    onChange={(e) => setModalIban(e.target.value)}
                    placeholder="IBAN"
                    className="w-full rounded border border-[#0d2137]/20 px-2 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={modalHolderName}
                    onChange={(e) => setModalHolderName(e.target.value)}
                    placeholder="Kontoinhaber"
                    className="w-full rounded border border-[#0d2137]/20 px-2 py-1.5 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={savingBank}
                      onClick={async () => {
                        setSavingBank(true);
                        try {
                          const res = await fetch(`/api/admin/driver-applications/${id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "update_bank_info",
                              iban: modalIban.trim() || null,
                              bank_account_holder_name: modalHolderName.trim() || null,
                            }),
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setApp((prev) => (prev ? { ...prev, iban: modalIban.trim() || null, bank_account_holder_name: modalHolderName.trim() || null } : null));
                            setEditingBankInModal(false);
                            fetchApp();
                          } else {
                            alert(data?.error || "Speichern fehlgeschlagen");
                          }
                        } finally {
                          setSavingBank(false);
                        }
                      }}
                      className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm text-white"
                    >
                      {savingBank ? "Speichern…" : "Speichern"}
                    </button>
                    <button type="button" onClick={() => setEditingBankInModal(false)} className="rounded border px-3 py-1.5 text-sm">
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-[#0d2137]/80">
                    IBAN: {app?.iban || "—"} · Inhaber: {app?.bank_account_holder_name || "—"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setModalIban(app?.iban ?? "");
                      setModalHolderName(app?.bank_account_holder_name ?? "");
                      setEditingBankInModal(true);
                    }}
                    className="text-sm text-[var(--accent)] hover:underline"
                  >
                    Bearbeiten
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#0d2137]">Betrag (€) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0d2137]">Trinkgeld (€), optional</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentTip}
                  onChange={(e) => setPaymentTip(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPaymentInvoiceModal(false)}
                className="rounded-xl border border-[#0d2137]/20 px-4 py-2 text-sm font-medium"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  const amount = parseFloat(paymentAmount) || 0;
                  const tip = parseFloat(paymentTip) || 0;
                  if (amount < 0) return;
                  window.open(
                    `/api/admin/driver-applications/${id}/payment-invoice?amount=${encodeURIComponent(amount)}&tip=${encodeURIComponent(tip)}`,
                    "_blank"
                  );
                }}
                className="text-sm text-[#0d2137]/70 hover:underline"
              >
                PDF laden
              </button>
              <button
                type="button"
                disabled={
                  sendingInvoiceEmail ||
                  !paymentAmount.trim() ||
                  Number.isNaN(parseFloat(paymentAmount)) ||
                  parseFloat(paymentAmount) < 0 ||
                  !app?.email?.trim()
                }
                onClick={async () => {
                  const amount = parseFloat(paymentAmount);
                  if (Number.isNaN(amount) || amount < 0) {
                    alert("Bitte gültigen Betrag (€) eingeben.");
                    return;
                  }
                  const tip = parseFloat(paymentTip) || 0;
                  setSendingInvoiceEmail(true);
                  try {
                    const res = await fetch(`/api/admin/driver-applications/${id}/send-payment-invoice-email`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ amount, tip }),
                    });
                    const data = await res.json();
                    if (res.ok && data.ok) {
                      const toEmail = data.sentTo ? ` an ${data.sentTo}` : "";
                      alert(`Rechnung gesendet${toEmail}. Bei Nicht-Eingang Spam-Ordner prüfen.`);
                      setPaymentInvoiceModal(false);
                    } else {
                      alert(data?.error ?? "Versand fehlgeschlagen");
                    }
                  } catch (e) {
                    alert("Netzwerkfehler. Bitte später erneut versuchen.");
                  } finally {
                    setSendingInvoiceEmail(false);
                  }
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {sendingInvoiceEmail ? "Senden…" : "An Fahrer-E-Mail senden"}
              </button>
              <p className="mt-2 w-full text-left text-xs text-[#0d2137]/60">
                Keine Mail? Spam prüfen; Domain unter{" "}
                <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">resend.com/domains</a>{" "}
                verifizieren.
              </p>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#0d2137]">Bewerbung ablehnen – Notizen & Bilder</h3>
            <p className="mt-2 text-sm text-[#0d2137]/70">
              Grund angeben (für den Fahrer). Optional Screenshots anhängen.
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#0d2137]">Ablehnungsgrund (Pflicht)</label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="z. B. Dokumente unvollständig, Foto unscharf…"
                className="mt-1 w-full rounded-xl border border-[#0d2137]/20 px-4 py-3 text-sm min-h-[100px]"
                rows={4}
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#0d2137]">Bilder anhängen (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={addRejectImages}
                className="mt-1 text-sm"
              />
              {rejectFiles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {rejectFiles.map((f, i) => (
                    <span key={i} className="flex items-center gap-1 rounded bg-[#0d2137]/10 px-2 py-1 text-xs">
                      {f.name}
                      <button type="button" onClick={() => removeRejectFile(i)} className="text-red-600 hover:underline">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModal(false);
                  setRejectNotes("");
                  setRejectFiles([]);
                }}
                className="rounded-xl border border-[#0d2137]/20 px-4 py-2 text-sm font-medium"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={actionLoading || !rejectNotes.trim()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "Speichern…" : "Ablehnung bestätigen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
