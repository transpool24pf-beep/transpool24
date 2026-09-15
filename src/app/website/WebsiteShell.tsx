"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cmsFetch } from "@/lib/website-cms-fetch";

const NAV = [
  { href: "/website", label: "الصفحة الرئيسية – تقييمات السائقين" },
  { href: "/website/hero", label: "الصفحة الرئيسية – البطل (صورة ونصوص)" },
  { href: "/website/transport", label: "الصفحة الرئيسية – بطاقات النقل" },
  { href: "/website/why", label: "الصفحة الرئيسية – لماذا TransPool24؟" },
  { href: "/website/why-media", label: "الصفحة الرئيسية – الوسائط (صور/فيديو)" },
  { href: "/website/social", label: "التذييل – روابط التواصل" },
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
    cmsFetch("/api/website/me")
      .then((r) => {
        if (r.ok) setAuthenticated(true);
        else setAuthenticated(false);
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setChecked(true));
  }, [pathname]);

  const handleLogout = () => {
    cmsFetch("/api/website/logout", { method: "POST" }).then(() => router.push("/website/login"));
  };

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d2137] text-white" dir="rtl" lang="ar">
        <p>جاري التحميل…</p>
      </div>
    );
  }

  if (pathname === "/website/login") {
    return <>{children}</>;
  }

  if (!authenticated) {
    router.replace("/website/login");
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d2137] text-white" dir="rtl" lang="ar">
        <p>جاري التحويل إلى تسجيل الدخول…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8eaed]" dir="rtl" lang="ar">
      <header className="fixed left-0 right-0 top-0 z-10 border-b border-[#0d2137]/10 bg-[#e85d04] px-4 py-3 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/website" className="text-lg font-semibold tracking-tight">
            TransPool24 – نظام إدارة محتوى الموقع
          </Link>
          <div className="relative h-10 w-32 shrink-0">
            <Image
              src="/logo.png"
              alt="TransPool24"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </div>
      </header>
      <div className="flex min-h-screen pt-14">
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
              className="rounded-lg px-4 py-3 text-right text-sm font-medium text-[#0d2137]/70 hover:bg-red-50 hover:text-red-700"
            >
              تسجيل الخروج
            </button>
          </nav>
        </aside>
        <main className="flex min-h-[calc(100vh-3.5rem)] min-w-0 flex-1 flex-col">
          <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</div>
          <footer className="border-t border-[#0d2137]/10 bg-white py-3 text-center text-xs text-[#0d2137]/60">
            <a
              href="https://www.transpool24.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0d2137]"
            >
              www.transpool24.com
            </a>
            <span className="mx-2">·</span>
            <span>محتوى الموقع فقط — بلا طلبات وبلا بيانات عملاء</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
