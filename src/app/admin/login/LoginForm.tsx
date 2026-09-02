"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";

function safeNextParam(raw: string | null): string {
  if (
    raw &&
    raw.startsWith("/admin") &&
    !raw.startsWith("/admin/login") &&
    !raw.includes("//") &&
    !raw.includes("\\")
  ) {
    return raw;
  }
  return "/admin/orders";
}

export function AdminLoginForm() {
  const { locale, t } = useAdminLocale();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRtl = locale === "ar";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (res.ok) {
        const dest = safeNextParam(searchParams.get("next"));
        router.push(dest);
        router.refresh();
      } else {
        setError(data.error || t("login.invalidPassword"));
      }
    } catch {
      setError(t("login.requestFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#0d2137] px-4"
      dir={isRtl ? "rtl" : "ltr"}
      lang={isRtl ? "ar" : "de"}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur"
      >
        <h1 className="mb-4 text-center text-xl font-semibold text-white">{t("login.title")}</h1>
        <p className="mb-4 text-center text-sm text-white/80">{t("login.subtitle")}</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("login.password")}
          className="mb-4 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:border-[var(--accent)] focus:outline-none"
          autoFocus
          required
          dir="ltr"
        />
        {error && <p className="mb-4 text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "…" : t("login.submit")}
        </button>
      </form>
    </div>
  );
}
