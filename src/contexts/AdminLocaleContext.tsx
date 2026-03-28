"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminT, type AdminLocale } from "@/lib/admin-ui-strings";

const STORAGE_KEY = "tp24_admin_ui_locale";

type Ctx = {
  locale: AdminLocale;
  setLocale: (l: AdminLocale) => void;
  t: (key: string) => string;
};

const AdminLocaleContext = createContext<Ctx | null>(null);

function readStoredLocale(): AdminLocale {
  if (typeof window === "undefined") return "de";
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s === "ar" ? "ar" : "de";
  } catch {
    return "de";
  }
}

export function AdminLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AdminLocale>("de");

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  const setLocale = useCallback((l: AdminLocale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback((key: string) => adminT(locale, key), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <AdminLocaleContext.Provider value={value}>{children}</AdminLocaleContext.Provider>;
}

export function useAdminLocale(): Ctx {
  const ctx = useContext(AdminLocaleContext);
  if (!ctx) {
    throw new Error("useAdminLocale must be used within AdminLocaleProvider");
  }
  return ctx;
}
