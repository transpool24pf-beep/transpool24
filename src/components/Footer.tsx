"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");

  return (
    <footer className="border-t border-[#0d2137]/10 bg-[#0d2137]/5">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-center text-sm text-[var(--foreground)]/80">
          {tCommon("slogan")} · {t("region")}
        </p>
        <p className="mt-2 text-center text-xs text-[var(--foreground)]/60">
          © {new Date().getFullYear()} TransPool24. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
