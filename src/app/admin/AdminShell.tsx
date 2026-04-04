"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminNavBadges, type AdminNavItem } from "@/components/admin/AdminNavBadges";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";

const NAV_DEF: { href: string; msgKey: string; badge: AdminNavItem["badge"] }[] = [
  { href: "/admin/orders", msgKey: "nav.orders", badge: "orders" },
  { href: "/admin/in-progress", msgKey: "nav.inProgress", badge: null },
  { href: "/admin/ratings", msgKey: "nav.ratings", badge: null },
  { href: "/admin/reports", msgKey: "nav.reports", badge: null },
  { href: "/admin/driver-applications", msgKey: "nav.driverApplications", badge: "drivers" },
  { href: "/admin/drivers", msgKey: "nav.drivers", badge: null },
  { href: "/admin/blog", msgKey: "nav.blog", badge: null },
  { href: "/admin/email-social", msgKey: "nav.emailSocial", badge: null },
  { href: "/admin/settings", msgKey: "nav.settings", badge: null },
  { href: "/admin/support", msgKey: "nav.support", badge: "support" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t } = useAdminLocale();
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [deployLine, setDeployLine] = useState<string | null>(null);
  const [deployMeta, setDeployMeta] = useState<{
    deploymentAbsoluteUrl: string | null;
    rateLimit: "off" | "memory";
    cronOrderRemindersConfigured: boolean;
  } | null>(null);
  const [seoLinks, setSeoLinks] = useState<{
    publicSiteUrl: string;
    sitemapUrl: string;
    robotsUrl: string;
  } | null>(null);

  const navItems: AdminNavItem[] = useMemo(
    () => NAV_DEF.map(({ href, msgKey, badge }) => ({ href, label: t(msgKey), badge })),
    [t],
  );

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecked(true);
      setAuthenticated(false);
      setDeployLine(null);
      setDeployMeta(null);
      setSeoLinks(null);
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

  useEffect(() => {
    if (!authenticated || pathname === "/admin/login") {
      setDeployLine(null);
      setDeployMeta(null);
      setSeoLinks(null);
      return;
    }
    let cancelled = false;
    fetch("/api/admin/deploy-info")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          j: {
            vercelEnv?: string | null;
            gitSha?: string | null;
            deploymentAbsoluteUrl?: string | null;
            rateLimit?: "off" | "memory";
            cronOrderRemindersConfigured?: boolean;
            seo?: { publicSiteUrl: string; sitemapUrl: string; robotsUrl: string };
          } | null,
        ) => {
          if (cancelled || !j) return;
          if (!j.vercelEnv && !j.gitSha) {
            setDeployLine(t("shell.footerDeployLocal"));
          } else {
            setDeployLine(
              t("shell.footerDeploy")
                .replace("{env}", j.vercelEnv ?? "—")
                .replace("{sha}", j.gitSha ?? "—")
            );
          }
          setDeployMeta({
            deploymentAbsoluteUrl: j.deploymentAbsoluteUrl ?? null,
            rateLimit: j.rateLimit === "off" ? "off" : "memory",
            cronOrderRemindersConfigured: Boolean(j.cronOrderRemindersConfigured),
          });
          if (j.seo?.publicSiteUrl && j.seo.sitemapUrl && j.seo.robotsUrl) {
            setSeoLinks({
              publicSiteUrl: j.seo.publicSiteUrl,
              sitemapUrl: j.seo.sitemapUrl,
              robotsUrl: j.seo.robotsUrl,
            });
          } else {
            setSeoLinks(null);
          }
        },
      )
      .catch(() => {
        if (!cancelled) {
          setDeployLine(null);
          setDeployMeta(null);
          setSeoLinks(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authenticated, pathname, t]);

  const handleLogout = () => {
    fetch("/api/admin/logout", { method: "POST" }).then(() => router.push("/admin/login"));
  };

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d2137] text-white">
        <p>{t("shell.loading")}</p>
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
        <p>{t("shell.redirectLogin")}</p>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen bg-[#e8eaed]"
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale === "ar" ? "ar" : "de"}
    >
      <header className="fixed left-0 right-0 top-0 z-10 border-b border-[#0d2137]/10 bg-[#0d2137] px-4 py-3 text-white shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin/orders" className="min-w-0 shrink text-lg font-semibold tracking-tight">
            {t("shell.headerTitle")}
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            <div
              className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 p-0.5"
              role="group"
              aria-label={t("shell.lang.title")}
            >
              <button
                type="button"
                onClick={() => setLocale("de")}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  locale === "de" ? "bg-white text-[#0d2137]" : "text-white/90 hover:bg-white/10"
                }`}
              >
                {t("shell.lang.de")}
              </button>
              <button
                type="button"
                onClick={() => setLocale("ar")}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  locale === "ar" ? "bg-white text-[#0d2137]" : "text-white/90 hover:bg-white/10"
                }`}
              >
                {t("shell.lang.ar")}
              </button>
            </div>
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
        </div>
      </header>
      <main className="flex min-h-screen flex-1 flex-col pt-14">
        <div
          className={`mx-auto flex-1 px-4 py-8 ${
            pathname === "/admin/orders" ||
            pathname === "/admin/in-progress" ||
            pathname?.startsWith("/admin/driver-applications") ||
            pathname === "/admin/reports" ||
            pathname?.startsWith("/admin/blog")
              ? "max-w-[98%] xl:max-w-7xl"
              : "max-w-4xl"
          }`}
        >
          {children}
        </div>
        <footer className="border-t border-[#0d2137]/10 bg-white py-2 px-2 text-center text-xs text-[#0d2137]/60">
          <a href="https://www.transpool24.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#0d2137]">
            www.transpool24.com
          </a>
          <p className="mt-1.5 text-[10px] leading-snug text-[#0d2137]/55">{t("shell.footerSecurity")}</p>
          <p className="mt-0.5 text-[10px] leading-snug text-[#0d2137]/50">{t("shell.footerCookieBanner")}</p>
          <p className="mt-0.5 text-[10px] leading-snug text-[#0d2137]/48">{t("shell.footerLegal")}</p>
          {seoLinks ? (
            <p className="mt-0.5 text-[10px] leading-snug text-[#0d2137]/46">
              {t("shell.footerSeoIntro")}{" "}
              <a
                href={seoLinks.publicSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#0d2137]"
              >
                {t("shell.footerSeoSite")}
              </a>
              {" · "}
              <a
                href={seoLinks.sitemapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#0d2137]"
              >
                {t("shell.footerSeoSitemap")}
              </a>
              {" · "}
              <a
                href={seoLinks.robotsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#0d2137]"
              >
                {t("shell.footerSeoRobots")}
              </a>
              {" · "}
              {t("shell.footerSeoGsc")}
            </p>
          ) : null}
          {deployLine ? (
            <p className="mt-0.5 text-[10px] leading-snug text-[#0d2137]/45">{deployLine}</p>
          ) : null}
          {deployMeta?.deploymentAbsoluteUrl ? (
            <p className="mt-0.5 text-[10px] leading-snug text-[#0d2137]/44">
              <a
                href={deployMeta.deploymentAbsoluteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all underline hover:text-[#0d2137]"
              >
                {t("shell.footerVercelDeployment")}
              </a>
            </p>
          ) : null}
          {deployMeta ? (
            <p className="mt-0.5 text-[10px] leading-snug text-[#0d2137]/42">
              {t("shell.footerRateLimit").replace("{mode}", deployMeta.rateLimit)}
              {" · "}
              {deployMeta.cronOrderRemindersConfigured
                ? t("shell.footerCronOn")
                : t("shell.footerCronOff")}
            </p>
          ) : null}
        </footer>
      </main>
      <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-56 shrink-0 border-l border-[#0d2137]/10 bg-white shadow-sm">
        <nav className="flex flex-col gap-1 p-4">
          <AdminNavBadges
            items={navItems}
            unreadBadgeAriaLabel={(n) => `${n} ${t("nav.unread")}`}
          />
          <div className="my-2 border-t border-[#0d2137]/10" />
          <button
            type="button"
            onClick={handleLogout}
            className={`rounded-lg px-4 py-3 text-sm font-medium text-[#0d2137]/70 hover:bg-red-50 hover:text-red-700 ${
              locale === "ar" ? "text-right" : "text-left"
            }`}
          >
            {t("shell.logout")}
          </button>
        </nav>
      </aside>
    </div>
  );
}
