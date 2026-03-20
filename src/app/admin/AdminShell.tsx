"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/admin/orders", label: "Orders / الطلبات" },
  { href: "/admin/reports", label: "تقارير / Reports" },
  { href: "/admin/driver-applications", label: "طلبات السائقين" },
  { href: "/admin/drivers", label: "Drivers / السائقين" },
  { href: "/admin/settings", label: "Settings / الإعدادات" },
  { href: "/admin/support", label: "رسائل الدعم (عرض الرسائل)" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecked(true);
      setAuthenticated(false);
      return;
    }
    fetch("/api/admin/me")
      .then((r) => {
        if (r.ok) setAuthenticated(true);
        else setAuthenticated(false);
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setChecked(true));
  }, [pathname]);

  const handleLogout = () => {
    fetch("/api/admin/logout", { method: "POST" }).then(() => router.push("/admin/login"));
  };

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d2137] text-white">
        <p>Loading…</p>
      </div>
    );
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!authenticated) {
    router.replace("/admin/login");
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d2137] text-white">
        <p>Redirecting to login…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#e8eaed]">
      <header className="fixed left-0 right-0 top-0 z-10 border-b border-[#0d2137]/10 bg-[#0d2137] px-4 py-3 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/admin/orders" className="text-lg font-semibold tracking-tight">
            TransPool24 – إدارة
          </Link>
          <div className="relative h-10 w-32 shrink-0">
            <Image
              src="/logo.png"
              alt="TransPool24"
              fill
              className="object-contain object-right"
              priority
            />
            <div className="absolute left-2 top-1/2 h-5 w-5 -translate-y-1/2 rounded-sm bg-[#0d2137]" aria-hidden />
            <div className="absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 rounded-sm bg-[#0d2137]" aria-hidden />
          </div>
        </div>
      </header>
      <main className="flex min-h-screen flex-1 flex-col pt-14">
        <div
          className={`mx-auto flex-1 px-4 py-8 ${
            pathname === "/admin/orders" ||
            pathname?.startsWith("/admin/driver-applications") ||
            pathname === "/admin/reports"
              ? "max-w-[98%] xl:max-w-7xl"
              : "max-w-4xl"
          }`}
        >
          {children}
        </div>
        <footer className="border-t border-[#0d2137]/10 bg-white py-2 text-center text-xs text-[#0d2137]/60">
          <a href="https://www.transpool24.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#0d2137]">
            www.transpool24.com
          </a>
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
                  ? "bg-[#0d2137] text-white"
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
            تسجيل الخروج
          </button>
        </nav>
      </aside>
    </div>
  );
}
