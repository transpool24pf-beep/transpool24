"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/admin/orders", label: "Orders / الطلبات" },
  { href: "/admin/drivers", label: "Drivers / السائقين" },
  { href: "/admin/settings", label: "Settings / الإعدادات" },
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
    <div className="min-h-screen bg-[#f0f2f5]">
      <header className="border-b border-[#0d2137]/10 bg-[#0d2137] px-4 py-3 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/admin/orders" className="font-semibold">
            TransPool24 – Admin
          </Link>
          <nav className="flex gap-4">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm ${pathname === href ? "underline" : "opacity-90 hover:opacity-100"}`}
              >
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm opacity-80 hover:opacity-100"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
