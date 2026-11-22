"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";
import {
  BOOKKEEPING_CATEGORIES,
  formatEurFromCents,
  type BookkeepingReceipt,
} from "@/lib/bookkeeping";

type ListPayload = {
  year: number;
  month: number;
  receipts: BookkeepingReceipt[];
  totals: { gross_cents: number; vat_cents: number };
  error?: string;
};

function centsToInput(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function BookkeepingPanel() {
  const { t } = useAdminLocale();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<ListPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<BookkeepingReceipt> & { gross?: string; net?: string; vat?: string }>>(
    {},
  );
  const camRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookkeeping?year=${year}&month=${month}`);
      const json = (await res.json()) as ListPayload & { error?: string };
      if (!res.ok) throw new Error(json.error || res.statusText);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("bk.sqlHint"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [year, month, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/bookkeeping", { method: "POST", body: fd });
      const json = (await res.json()) as { error?: string; ocr_status?: string };
      if (!res.ok) throw new Error(json.error || res.statusText);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("bk.sqlHint"));
    } finally {
      setUploading(false);
      if (camRef.current) camRef.current.value = "";
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const receipts = data?.receipts ?? [];
  const monthValue = useMemo(
    () => `${year}-${String(month).padStart(2, "0")}`,
    [year, month],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2137]">{t("bk.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-[#0d2137]/70">{t("bk.subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium text-[#0d2137]">
          {t("bk.month")}
          <input
            type="month"
            className="mt-1 block rounded-xl border-2 border-[#0d2137]/25 bg-white px-3 py-2"
            value={monthValue}
            onChange={(e) => {
              const [y, m] = e.target.value.split("-").map(Number);
              if (y && m) {
                setYear(y);
                setMonth(m);
              }
            }}
          />
        </label>
        <a
          href={`/api/admin/bookkeeping/export?year=${year}&month=${month}`}
          className="rounded-xl bg-[#0d2137] px-5 py-2.5 text-sm font-semibold text-white"
        >
          {t("bk.export")}
        </a>
        {data ? (
          <p className="text-sm text-[#0d2137]/70">
            {t("bk.totals")}: {formatEurFromCents(data.totals.gross_cents)} · USt{" "}
            {formatEurFromCents(data.totals.vat_cents)}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border-2 border-dashed border-[#0d2137]/25 bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-[#0d2137]">{t("bk.upload")}</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={uploading}
            onClick={() => camRef.current?.click()}
            className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {uploading ? t("bk.uploading") : t("bk.camera")}
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border-2 border-[#0d2137]/35 bg-white px-5 py-2.5 text-sm font-semibold text-[#0d2137] disabled:opacity-60"
          >
            {t("bk.file")}
          </button>
        </div>
        <input
          ref={camRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? <p className="text-sm text-[#0d2137]/60">{t("bk.uploading")}</p> : null}
      {!loading && receipts.length === 0 ? (
        <p className="rounded-2xl border bg-white px-4 py-8 text-center text-sm text-[#0d2137]/55">{t("bk.empty")}</p>
      ) : null}

      <div className="space-y-4">
        {receipts.map((r) => {
          const d = drafts[r.id] ?? {};
          const vendor = d.vendor_name ?? r.vendor_name ?? "";
          const date = (d.document_date ?? r.document_date ?? "").slice(0, 10);
          const invoice = d.invoice_number ?? r.invoice_number ?? "";
          const category = d.category ?? r.category ?? "sonstiges";
          const gross = d.gross ?? centsToInput(r.gross_cents);
          const net = d.net ?? centsToInput(r.net_cents);
          const vat = d.vat ?? centsToInput(r.vat_cents);
          return (
            <article key={r.id} className="grid gap-4 rounded-2xl border-2 border-[#0d2137]/15 bg-white p-4 shadow-sm md:grid-cols-[160px_1fr]">
              {r.file_url && r.mime_type?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.file_url} alt="" className="h-40 w-full rounded-xl object-cover" />
              ) : (
                <a href={r.file_url ?? "#"} className="flex h-40 items-center justify-center rounded-xl bg-[#f1f5f9] text-sm text-[#0d2137]">
                  PDF
                </a>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs font-medium text-[#0d2137]/70">
                  {t("bk.vendor")}
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={vendor}
                    onChange={(e) => setDrafts((s) => ({ ...s, [r.id]: { ...s[r.id], vendor_name: e.target.value } }))}
                  />
                </label>
                <label className="text-xs font-medium text-[#0d2137]/70">
                  {t("bk.date")}
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={date}
                    onChange={(e) => setDrafts((s) => ({ ...s, [r.id]: { ...s[r.id], document_date: e.target.value } }))}
                  />
                </label>
                <label className="text-xs font-medium text-[#0d2137]/70">
                  {t("bk.invoiceNo")}
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={invoice}
                    onChange={(e) =>
                      setDrafts((s) => ({ ...s, [r.id]: { ...s[r.id], invoice_number: e.target.value } }))
                    }
                  />
                </label>
                <label className="text-xs font-medium text-[#0d2137]/70">
                  {t("bk.category")}
                  <select
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={category}
                    onChange={(e) => setDrafts((s) => ({ ...s, [r.id]: { ...s[r.id], category: e.target.value } }))}
                  >
                    {BOOKKEEPING_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {t(`bk.cat.${c}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-[#0d2137]/70">
                  {t("bk.gross")}
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={gross}
                    onChange={(e) => setDrafts((s) => ({ ...s, [r.id]: { ...s[r.id], gross: e.target.value } }))}
                  />
                </label>
                <label className="text-xs font-medium text-[#0d2137]/70">
                  {t("bk.net")}
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={net}
                    onChange={(e) => setDrafts((s) => ({ ...s, [r.id]: { ...s[r.id], net: e.target.value } }))}
                  />
                </label>
                <label className="text-xs font-medium text-[#0d2137]/70">
                  {t("bk.vat")}
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={vat}
                    onChange={(e) => setDrafts((s) => ({ ...s, [r.id]: { ...s[r.id], vat: e.target.value } }))}
                  />
                </label>
                <p className="self-end text-xs text-[#0d2137]/55">
                  {r.ocr_status === "done"
                    ? t("bk.ocrDone")
                    : r.ocr_status === "failed"
                      ? t("bk.ocrFail")
                      : t("bk.ocrSkip")}
                </p>
                <div className="flex gap-2 sm:col-span-2">
                  <button
                    type="button"
                    disabled={savingId === r.id}
                    className="rounded-lg bg-[#0d2137] px-4 py-2 text-sm font-semibold text-white"
                    onClick={async () => {
                      setSavingId(r.id);
                      try {
                        const res = await fetch(`/api/admin/bookkeeping/${r.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            vendor_name: vendor,
                            document_date: date,
                            invoice_number: invoice,
                            category,
                            gross_eur: gross,
                            net_eur: net,
                            vat_eur: vat,
                          }),
                        });
                        if (!res.ok) {
                          const j = (await res.json()) as { error?: string };
                          throw new Error(j.error || res.statusText);
                        }
                        await load();
                      } catch (e) {
                        setError(e instanceof Error ? e.message : t("bk.sqlHint"));
                      } finally {
                        setSavingId(null);
                      }
                    }}
                  >
                    {t("bk.save")}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border px-4 py-2 text-sm text-red-700"
                    onClick={async () => {
                      if (!confirm(t("bk.delete"))) return;
                      await fetch(`/api/admin/bookkeeping/${r.id}`, { method: "DELETE" });
                      await load();
                    }}
                  >
                    {t("bk.delete")}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
