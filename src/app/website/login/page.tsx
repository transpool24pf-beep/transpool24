"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WebsiteLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/website/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/website");
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Anmeldung fehlgeschlagen");
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d2137] px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <h1 className="text-center text-xl font-semibold">TransPool24 – Website</h1>
        <p className="mt-2 text-center text-sm text-white/70">
          Nur für die Verwaltung von Inhalten auf www.transpool24.com (keine Aufträge).
        </p>
        <p className="mt-1 text-center text-xs text-white/50">
          Eigenes Passwort – nicht dasselbe wie die Auftrags-Administration.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="wp" className="mb-1 block text-sm text-white/80">
              Passwort
            </label>
            <input
              id="wp"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              placeholder="••••••••"
            />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] py-3 font-medium text-white hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "…" : "Anmelden"}
          </button>
        </form>
      </div>
    </div>
  );
}
