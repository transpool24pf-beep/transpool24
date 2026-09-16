"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { DRIVER_POLICY_LEGAL_REF } from "@/lib/driver-policy";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";

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
  /** Cents still owed to driver; decreases when admin records a payment */
  payable_balance_cents?: number;
};

const UPLOAD_URL = "/api/driver-applications/upload";

export default function AdminDriverApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const { locale, t } = useAdminLocale();
  const dateLocale = locale === "ar" ? "ar-SA" : "de-DE";
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
  const [balancePayEur, setBalancePayEur] = useState("");
  const [balanceAddEur, setBalanceAddEur] = useState("");
  const [balanceSetEur, setBalanceSetEur] = useState("");
  const [balanceLoading, setBalanceLoading] = useState(false);

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
    if (!id || !window.confirm(t("da.approveConfirm"))) return;
    setActionLoading(true);
    fetch(`/api/admin/driver-applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          alert(data?.error || t("da.failed"));
          return;
        }
        fetchApp();
      })
      .catch(() => alert(t("da.connection")))
      .finally(() => setActionLoading(false));
  };

  const handleRejectSubmit = async () => {
    const notes = rejectNotes.trim();
    if (!notes) {
      alert(t("da.needRejectNotes"));
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
        alert(data?.error || t("da.failed"));
      }
    } catch {
      alert(t("da.connection"));
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
      ? t("driverApps.status.new")
      : app?.status === "approved"
        ? t("driverApps.status.approved")
        : app?.status === "rejected"
          ? t("driverApps.status.rejected")
          : app?.status || "";

  if (!id || loading) return <p className="text-[#0d2137]/70">{t("common.loading")}</p>;
  if (!app) return <p className="text-[#0d2137]/70">{t("da.notFound")}</p>;

  const welcomeMessage =
    "Hallo, deine Bewerbung bei TransPool24 wurde genehmigt. Du wartest auf die erste Tour. Tritt der Fahrer-WhatsApp-Gruppe bei, um Aufträge zu erhalten.";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/driver-applications"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          {t("da.back")}
        </Link>
      </div>

      <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#0d2137]">{t("da.title")}: {app.full_name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#0d2137]/60">
          {new Date(app.created_at).toLocaleString(dateLocale)} · {t("da.status")}: {statusLabel}
          {app.driver_number != null && (
            <span className="rounded bg-[var(--accent)]/15 px-2 py-0.5 font-medium text-[var(--accent)]">
              {t("da.driverNo")} #{String(app.driver_number).padStart(5, "0")}
            </span>
          )}
          {app.suspended_at && (
            <span className="rounded bg-red-100 px-2 py-0.5 font-medium text-red-700">{t("da.suspended")}</span>
          )}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <p><strong>{t("da.email")}:</strong> <span dir="ltr">{app.email}</span></p>
          <p><strong>{t("da.phone")}:</strong> <span dir="ltr">{app.phone}</span></p>
          <p><strong>{t("da.city")}:</strong> {app.city}</p>
          <p><strong>{t("da.tax")}:</strong> {app.tax_or_commercial_number || "-"}</p>
          <p><strong>{t("da.languages")}:</strong> {app.languages_spoken || "-"}</p>
          <p><strong>{t("da.plate")}:</strong> {app.vehicle_plate || "-"}</p>
        </div>

        <div className="mt-6 rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.03] p-4">
          <p className="mb-2 text-sm font-semibold text-[#0d2137]/80">{t("da.consents")}</p>
          <p className="mb-2 text-xs text-[#0d2137]/60">
            {t("da.policyRef")}{" "}
            <code className="rounded bg-[#0d2137]/10 px-1.5 py-0.5 font-mono text-[11px]">{DRIVER_POLICY_LEGAL_REF}</code>
          </p>
          <ul className="space-y-1.5 text-sm text-[#0d2137]/85">
            <li>
              <strong>{t("da.waConsent")}:</strong>{" "}
              {app.service_policy_accepted ? (
                <span className="text-emerald-700">{t("da.yes")}</span>
              ) : (
                <span className="text-amber-700">{t("da.no")}</span>
              )}
            </li>
            <li>
              <strong>{t("da.workConsent")}:</strong>{" "}
              {app.work_policy_accepted ? (
                <span className="text-emerald-700">{t("da.yes")}</span>
              ) : (
                <span className="text-amber-700">{t("da.no")}</span>
              )}
            </li>
            <li>
              <strong>{t("da.submitted")}:</strong> {new Date(app.created_at).toLocaleString(dateLocale)}
            </li>
          </ul>
        </div>

        {app.status === "approved" && app.stats && (
          <div className="mt-6 rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.03] p-4">
            <p className="mb-2 text-sm font-semibold text-[#0d2137]/80">{t("da.stats")}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span><strong>{t("da.jobs")}:</strong> {app.stats.jobs_count}</span>
              <span><strong>{t("da.paidOut")}:</strong> {(app.stats.total_paid_cents / 100).toFixed(2)} €</span>
              <span className="flex items-center gap-1">
                <strong>{t("da.customerRating")}:</strong>
                {(app.stats.customer_rating_avg ?? app.star_rating) != null ? (
                  <span className="text-amber-500">
                    {"★".repeat(Math.round(app.stats.customer_rating_avg ?? app.star_rating ?? 0))}
                    {"☆".repeat(5 - Math.round(app.stats.customer_rating_avg ?? app.star_rating ?? 0))}
                    {" "}({(app.stats.customer_rating_avg ?? app.star_rating)?.toFixed(1)})
                  </span>
                ) : (
                  "-"
                )}
              </span>
              <span className="flex items-center gap-1">
                <strong>{t("da.manualStars")}:</strong>
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
          <div className="mt-6 rounded-xl border-2 border-emerald-400/50 bg-gradient-to-br from-emerald-50/95 to-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#0d2137]/90">{t("da.balance")}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-900">
              {((app.payable_balance_cents ?? 0) / 100).toFixed(2)} €
            </p>
            <p className="mt-2 text-xs text-[#0d2137]/55">
              {t("da.balanceHint")}
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-[#0d2137]/70">{t("da.recordPay")}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={balancePayEur}
                  onChange={(e) => setBalancePayEur(e.target.value)}
                  placeholder={t("da.payExample")}
                  className="mt-1 w-36 rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                disabled={balanceLoading}
                onClick={async () => {
                  const raw = balancePayEur.trim().replace(",", ".");
                  const n = parseFloat(raw);
                  if (!Number.isFinite(n) || n <= 0) {
                    alert(t("da.needPositive"));
                    return;
                  }
                  setBalanceLoading(true);
                  try {
                    const res = await fetch(`/api/admin/driver-applications/${id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "record_driver_payment", amount_eur: n }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setBalancePayEur("");
                      fetchApp();
                    } else {
                      alert(data?.error ?? t("da.failed"));
                    }
                  } catch {
                    alert(t("da.connection"));
                  } finally {
                    setBalanceLoading(false);
                  }
                }}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {t("da.subtract")}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-emerald-200/80 pt-4">
              <div>
                <label className="block text-xs font-medium text-[#0d2137]/70">{t("da.addCredit")}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={balanceAddEur}
                  onChange={(e) => setBalanceAddEur(e.target.value)}
                  placeholder="0,00"
                  className="mt-1 w-36 rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                disabled={balanceLoading}
                onClick={async () => {
                  const raw = balanceAddEur.trim().replace(",", ".");
                  const n = parseFloat(raw);
                  if (!Number.isFinite(n) || n <= 0) {
                    alert(t("da.needPositive"));
                    return;
                  }
                  setBalanceLoading(true);
                  try {
                    const res = await fetch(`/api/admin/driver-applications/${id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "add_payable_balance", amount_eur: n }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setBalanceAddEur("");
                      fetchApp();
                    } else {
                      alert(data?.error ?? t("da.failed"));
                    }
                  } catch {
                    alert(t("da.connection"));
                  } finally {
                    setBalanceLoading(false);
                  }
                }}
                className="rounded-lg border border-emerald-600/40 bg-white px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-50 disabled:opacity-50"
              >
                {t("da.credit")}
              </button>
              {app.stats != null && (
                <button
                  type="button"
                  disabled={balanceLoading}
                  onClick={async () => {
                    const sum = app.stats!.total_paid_cents;
                    if (
                      !window.confirm(
                        t("da.balanceEqualsJobsConfirm").replace("{eur}", (sum / 100).toFixed(2))
                      )
                    )
                      return;
                    setBalanceLoading(true);
                    try {
                      const res = await fetch(`/api/admin/driver-applications/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "set_payable_balance", value_cents: sum }),
                      });
                      const data = await res.json();
                      if (res.ok) fetchApp();
                      else alert(data?.error ?? t("da.failed"));
                    } catch {
                      alert(t("da.connection"));
                    } finally {
                      setBalanceLoading(false);
                    }
                  }}
                  className="rounded-lg bg-[#0d2137]/10 px-3 py-2 text-xs font-medium text-[#0d2137]/80 hover:bg-[#0d2137]/15 disabled:opacity-50"
                >
                  {t("da.balanceEqualsJobs")}
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-[#0d2137]/70">{t("da.setBalance")}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={balanceSetEur}
                  onChange={(e) => setBalanceSetEur(e.target.value)}
                  placeholder="0,00"
                  className="mt-1 w-36 rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                disabled={balanceLoading}
                onClick={async () => {
                  const raw = balanceSetEur.trim().replace(",", ".");
                  const n = parseFloat(raw);
                  if (!Number.isFinite(n) || n < 0) {
                    alert(t("da.needAmount"));
                    return;
                  }
                  if (!window.confirm(t("da.setBalanceConfirm").replace("{eur}", n.toFixed(2)))) return;
                  setBalanceLoading(true);
                  try {
                    const res = await fetch(`/api/admin/driver-applications/${id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "set_payable_balance", value_cents: Math.round(n * 100) }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setBalanceSetEur("");
                      fetchApp();
                    } else {
                      alert(data?.error ?? t("da.failed"));
                    }
                  } catch {
                    alert(t("da.connection"));
                  } finally {
                    setBalanceLoading(false);
                  }
                }}
                className="rounded-lg border border-[#0d2137]/25 px-3 py-2 text-xs font-medium text-[#0d2137]/80 hover:bg-[#0d2137]/5 disabled:opacity-50"
              >
                {t("da.overwriteBalance")}
              </button>
            </div>
          </div>
        )}

        {app.status === "approved" && (
          <div className="mt-4">
            <p className="mb-1 text-sm font-semibold text-[#0d2137]/80">{t("da.desiredPay")}</p>
            {desiredNoteEdit !== "" ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={desiredNoteEdit}
                  onChange={(e) => setDesiredNoteEdit(e.target.value)}
                  className="flex-1 rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                  placeholder={t("da.desiredPlaceholder")}
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
                  {t("da.save")}
                </button>
                <button type="button" onClick={() => setDesiredNoteEdit("")} className="rounded-lg border px-3 py-2 text-sm">
                  {t("da.cancel")}
                </button>
              </div>
            ) : (
              <p className="text-sm text-[#0d2137]/70">
                {app.desired_note || "-"}
                <button
                  type="button"
                  onClick={() => setDesiredNoteEdit(app.desired_note ?? "")}
                  className="mr-2 text-[var(--accent)] hover:underline"
                >
                  {t("da.edit")}
                </button>
              </p>
            )}
          </div>
        )}

        {app.status === "approved" && (
          <div className="mt-6 rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.03] p-4">
            <p className="mb-2 text-sm font-semibold text-[#0d2137]/80">{t("da.bank")}</p>
            <p className="mb-1 text-xs text-[#0d2137]/60">{t("da.bankHint")}</p>
            {editingBank ? (
              <div className="space-y-3">
                <p className="text-xs text-[#0d2137]/60">{t("da.bankAutosave")}</p>
                <div>
                  <label className="block text-xs font-medium text-[#0d2137]/80">{t("da.iban")}</label>
                  <input
                    type="text"
                    value={bankIban}
                    onChange={(e) => setBankIban(e.target.value)}
                    placeholder="DE89 3704 0044 0532 0130 00"
                    className="mt-1 w-full max-w-md rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0d2137]/80">{t("da.holderCard")}</label>
                  <input
                    type="text"
                    value={bankHolderName}
                    onChange={(e) => setBankHolderName(e.target.value)}
                    placeholder="Wisam Dandash"
                    className="mt-1 w-full max-w-md rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                  />
                </div>
                <button type="button" onClick={() => setEditingBank(false)} className="rounded-lg border px-3 py-2 text-sm">
                  {t("da.cancel")}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-[#0d2137]/80">
                  {t("da.iban")}: {app.iban || "-"} · {t("da.holder")}: {app.bank_account_holder_name || "-"}
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
                  {app.iban || app.bank_account_holder_name ? t("da.edit") : t("da.addBank")}
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
                {t("da.approve")}
              </button>
              <button
                type="button"
                onClick={() => setRejectModal(true)}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {t("da.reject")}
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
                        alert(data?.error || t("da.failed"));
                      }
                    } catch {
                      alert(t("da.connection"));
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {t("da.assignNumber")}
                </button>
              )}
              <a
                href={`/api/admin/driver-applications/${id}/approval-pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {t("da.approvalPdf")}
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
                {t("da.paymentInvoice")}
              </button>
              <button
                type="button"
                onClick={() => openWhatsApp(welcomeMessage)}
                className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:bg-[#25D366]/90"
              >
                {t("da.welcomeWa")}
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
                      alert(t("da.approvalEmailSent"));
                    } else {
                      alert(data?.error ?? t("da.sendFailed"));
                    }
                  } catch {
                    alert(t("da.connection"));
                  } finally {
                    setEmailSending(false);
                  }
                }}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {emailSending ? t("da.sending") : t("da.sendApprovalEmail")}
              </button>
              <p className="mt-1 text-xs text-gray-500">
                {t("da.resendHintBefore")}{" "}
                <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline">
                  resend.com/domains
                </a>{" "}
                {t("da.resendHintAfter")}
              </p>
              {app.suspended_at ? (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={async () => {
                    if (!window.confirm(t("da.unsuspendConfirm"))) return;
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
                  {t("da.unsuspend")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={async () => {
                    if (!window.confirm(t("da.suspendConfirm"))) return;
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
                  {t("da.suspend")}
                </button>
              )}
            </>
          )}

          {app.status === "rejected" && app.rejection_notes && (
            <div className="mt-4 w-full rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">{t("da.rejectReason")}:</p>
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
        <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">{t("da.docs")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(app.id_document_front_url || app.id_document_url) && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">{t("da.idFront")}</p>
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
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">{t("da.idBack")}</p>
              <a href={app.id_document_back_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                <img src={app.id_document_back_url} alt="" className="h-32 w-full object-cover" />
              </a>
            </div>
          )}
          {app.license_front_url && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">{t("da.licenseFront")}</p>
              <a href={app.license_front_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                <img src={app.license_front_url} alt="" className="h-32 w-full object-cover" />
              </a>
            </div>
          )}
          {app.license_back_url && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">{t("da.licenseBack")}</p>
              <a href={app.license_back_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                <img src={app.license_back_url} alt="" className="h-32 w-full object-cover" />
              </a>
            </div>
          )}
          {app.personal_photo_url && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">{t("da.passportPhoto")}</p>
              <a href={app.personal_photo_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                <img src={app.personal_photo_url} alt="" className="h-32 w-full object-cover" />
              </a>
            </div>
          )}
          {app.vehicle_documents_url && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">{t("da.vehicleDocs")}</p>
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
              <p className="mb-2 text-sm font-medium text-[#0d2137]/80">{t("da.vehiclePhoto")}</p>
              <a href={app.vehicle_photo_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                <img src={app.vehicle_photo_url} alt="" className="h-32 w-full object-cover" />
              </a>
            </div>
          )}
        </div>
      </div>

      {app.last_jobs && app.last_jobs.length > 0 && (
        <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">{t("da.lastJobs")}</h2>
          <div className="space-y-3">
            {app.last_jobs.map((job) => (
              <Link
                key={job.id}
                href={`/admin/orders/${job.id}`}
                className="block rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.02] p-4 transition hover:bg-[#0d2137]/[0.05]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-[#0d2137]">
                    {t("da.order")} #{job.order_number ?? job.id.slice(0, 8)}
                  </span>
                  <span className="text-sm text-[#0d2137]/70">
                    {new Date(job.created_at).toLocaleString(dateLocale)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#0d2137]/80">
                  {job.company_name} · {String(job.pickup_address).slice(0, 40)}… → {String(job.delivery_address).slice(0, 40)}…
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-[#0d2137]/10 px-2 py-0.5">
                    {job.logistics_status === "delivered" ? t("da.st.delivered") : job.logistics_status === "in_transit" ? t("da.st.in_transit") : job.logistics_status === "assigned" ? t("da.st.assigned") : job.logistics_status}
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
          <p className="text-sm text-[#0d2137]/70">{t("da.noJobs")}</p>
        </div>
      )}

      {paymentInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#0d2137]">{t("da.invoiceTitle")}</h3>
            <p className="mt-1 text-sm text-[#0d2137]/70">
              {t("da.invoiceHint")}
            </p>
            <div className="mt-4 rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.03] p-3">
              <p className="mb-1 text-xs font-semibold text-[#0d2137]/80">{t("da.bankInPdf")}</p>
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
                    placeholder={t("da.holder")}
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
                            alert(data?.error || t("da.saveFailed"));
                          }
                        } finally {
                          setSavingBank(false);
                        }
                      }}
                      className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm text-white"
                    >
                      {savingBank ? t("da.saving") : t("da.save")}
                    </button>
                    <button type="button" onClick={() => setEditingBankInModal(false)} className="rounded border px-3 py-1.5 text-sm">
                      {t("da.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-[#0d2137]/80">
                    {t("da.iban")}: {app?.iban || "-"} · {t("da.holder")}: {app?.bank_account_holder_name || "-"}
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
                    {t("da.edit")}
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#0d2137]">{t("da.amount")}</label>
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
                <label className="block text-sm font-medium text-[#0d2137]">{t("da.tip")}</label>
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
                {t("da.cancel")}
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
                {t("da.loadPdf")}
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
                    alert(t("da.needValidEur"));
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
                      const toEmail = data.sentTo ? ` ${data.sentTo}` : "";
                      alert(t("da.invoiceSent").replace("{to}", toEmail));
                      setPaymentInvoiceModal(false);
                    } else {
                      alert(data?.error ?? t("da.sendFailed"));
                    }
                  } catch (e) {
                    alert(t("da.networkLater"));
                  } finally {
                    setSendingInvoiceEmail(false);
                  }
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {sendingInvoiceEmail ? t("da.sending") : t("da.sendToDriverEmail")}
              </button>
              <p className="mt-2 w-full text-start text-xs text-[#0d2137]/60">
                {t("da.noMailHintBefore")}{" "}
                <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">resend.com/domains</a>{" "}
                {t("da.noMailHintAfter")}
              </p>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#0d2137]">{t("da.rejectModalTitle")}</h3>
            <p className="mt-2 text-sm text-[#0d2137]/70">
              {t("da.rejectModalHint")}
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#0d2137]">{t("da.rejectNotes")}</label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder={t("da.rejectNotesPh")}
                className="mt-1 w-full rounded-xl border border-[#0d2137]/20 px-4 py-3 text-sm min-h-[100px]"
                rows={4}
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#0d2137]">{t("da.attachImages")}</label>
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
                {t("da.cancel")}
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={actionLoading || !rejectNotes.trim()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? t("da.saving") : t("da.confirmReject")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
