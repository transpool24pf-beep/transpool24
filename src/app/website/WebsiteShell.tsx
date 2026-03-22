"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/website", label: "Homepage – Bewertungen" },
  { href: "/website/hero", label: "Homepage – Hero (Bild & Texte)" },
  { href: "/website/transport", label: "Homepage – Transport-Kacheln" },
  { href: "/website/why", label: "Homepage – Warum TransPool24?" },
  { href: "/website/why-media", label: "Homepage – Medien (Why)" },
  { href: "/website/social", label: "Footer – Social Media URLs" },
];

export function WebsiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (pathname === "/website/login") {
      setChecked(true);
      setAuthenticated(false);
      return;
    }
    fetch("/api/website/me")
      .then((r) => {
        if (r.ok) setAuthenticated(true);
        else setAuthenticated(false);
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setChecked(true));
  }, [pathname]);

  const handleLogout = () => {
    fetch("/api/website/logout", { method: "POST" }).then(() => router.push("/website/login"));
  };

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d2137] text-white">
        <p>Laden…</p>
      </div>
    );
  }

  if (pathname === "/website/login") {
    return <>{children}</>;
  }

  if (!authenticated) {
    router.replace("/website/login");
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d2137] text-white">
        <p>Weiterleitung zur Anmeldung…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#e8eaed]">
      <header className="fixed left-0 right-0 top-0 z-10 border-b border-[#0d2137]/10 bg-[#e85d04] px-4 py-3 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/website" className="text-lg font-semibold tracking-tight">
            TransPool24 – Website (nur Inhalt)
          </Link>
          <div className="relative h-10 w-32 shrink-0">
            <Image
              src="/logo.png"
              alt="TransPool24"
              fill
              className="object-contain object-right"
              priority
            />
          </div>
        </div>
      </header>
      <main className="flex min-h-screen flex-1 flex-col pt-14">
        <div className="mx-auto flex-1 max-w-4xl px-4 py-8">{children}</div>
        <footer className="border-t border-[#0d2137]/10 bg-white py-2 text-center text-xs text-[#0d2137]/60">
          <a
            href="https://www.transpool24.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#0d2137]"
          >
            www.transpool24.com
          </a>
          <span className="mx-2">·</span>
          <span>Keine Aufträge / keine Kundendaten hier</span>
          <span className="mx-2">·</span>
          <span>
            Öffentliche Buchung (/order): Lottie bei Strecke &amp; Zusammenfassung · Fahrer-Landing (/driver): Hinweis Live-Tracking
          </span>
        </footer>
      </main>
      <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-56 shrink-0 border-l border-[#0d2137]/10 bg-white shadow-sm">
        <nav className="flex flex-col gap-1 p-4">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-4 py-3 text-sm font-medium transition ${
                pathname === href
                  ? "bg-[#e85d04] text-white"
                  : "text-[#0d2137]/80 hover:bg-[#0d2137]/5 hover:text-[#0d2137]"
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="my-2 border-t border-[#0d2137]/10" />
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg px-4 py-3 text-left text-sm font-medium text-[#0d2137]/70 hover:bg-red-50 hover:text-red-700"
          >
            Abmelden
          </button>
        </nav>
      </aside>
    </div>
  );
}
