"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playAdminNotificationAlarm } from "@/lib/admin-notification-sound";

const STORAGE_KEY = "tp24_admin_notif_ack_v1";
const POLL_MS = 25_000;

type AckStore = {
  orders: string[];
  drivers: string[];
  support: string[];
};

export type AdminNavItem = {
  href: string;
  label: string;
  badge: "orders" | "drivers" | "support" | null;
};

function loadAck(): AckStore {
  if (typeof window === "undefined") return { orders: [], drivers: [], support: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { orders: [], drivers: [], support: [] };
    const p = JSON.parse(raw) as Partial<AckStore>;
    return {
      orders: Array.isArray(p.orders) ? p.orders : [],
      drivers: Array.isArray(p.drivers) ? p.drivers : [],
      support: Array.isArray(p.support) ? p.support : [],
    };
  } catch {
    return { orders: [], drivers: [], support: [] };
  }
}

function saveAck(s: AckStore) {
  const cap = (arr: string[]) => [...new Set(arr)].slice(-600);
  const next = { orders: cap(s.orders), drivers: cap(s.drivers), support: cap(s.support) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function mergeAckIds(existing: string[], add: string[]): string[] {
  return [...new Set([...existing, ...add])];
}

function unseenCount(current: string[], ackList: string[]): number {
  const ack = new Set(ackList);
  return current.filter((id) => !ack.has(id)).length;
}

export function AdminNavBadges({
  items,
  unreadBadgeAriaLabel = (n: number) => `${n} ungelesen`,
}: {
  items: AdminNavItem[];
  /** e.g. (n) => `${n} غير مقروء` */
  unreadBadgeAriaLabel?: (count: number) => string;
}) {
  const pathname = usePathname();
  const [ack, setAck] = useState<AckStore>({ orders: [], drivers: [], support: [] });
  const [hydrated, setHydrated] = useState(false);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [driverIds, setDriverIds] = useState<string[]>([]);
  const [supportIds, setSupportIds] = useState<string[]>([]);
  const [notifLoaded, setNotifLoaded] = useState(false);
  const prevDisplayRef = useRef<{ orders: number; drivers: number; support: number } | null>(null);

  useEffect(() => {
    setAck(loadAck());
    setHydrated(true);
  }, []);

  const fetchNotifications = useCallback(async () => {
    const r = await fetch("/api/admin/notifications", { cache: "no-store" });
    if (!r.ok) return;
    const data = (await r.json()) as {
      orderAttentionIds?: string[];
      driverApplicationIds?: string[];
      supportOpenIds?: string[];
    };
    setOrderIds(Array.isArray(data.orderAttentionIds) ? data.orderAttentionIds.map(String) : []);
    setDriverIds(Array.isArray(data.driverApplicationIds) ? data.driverApplicationIds.map(String) : []);
    setSupportIds(Array.isArray(data.supportOpenIds) ? data.supportOpenIds.map(String) : []);
    setNotifLoaded(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void fetchNotifications();
    const id = window.setInterval(() => void fetchNotifications(), POLL_MS);
    const onFocus = () => void fetchNotifications();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [hydrated, fetchNotifications]);

  const display = useMemo(() => {
    if (!hydrated) return { orders: 0, drivers: 0, support: 0 };
    return {
      orders: unseenCount(orderIds, ack.orders),
      drivers: unseenCount(driverIds, ack.drivers),
      support: unseenCount(supportIds, ack.support),
    };
  }, [hydrated, orderIds, driverIds, supportIds, ack]);

  useEffect(() => {
    if (!hydrated) return;
    const onOrders = pathname === "/admin/orders" || pathname?.startsWith("/admin/orders/");
    const onDrivers = pathname === "/admin/driver-applications" || pathname?.startsWith("/admin/driver-applications/");
    const onSupport = pathname === "/admin/support";

    setAck((prev) => {
      let orders = prev.orders;
      let drivers = prev.drivers;
      let support = prev.support;
      let changed = false;
      if (onOrders && orderIds.length) {
        const m = mergeAckIds(prev.orders, orderIds);
        if (m.length !== prev.orders.length) {
          orders = m;
          changed = true;
        }
      }
      if (onDrivers && driverIds.length) {
        const m = mergeAckIds(prev.drivers, driverIds);
        if (m.length !== prev.drivers.length) {
          drivers = m;
          changed = true;
        }
      }
      if (onSupport && supportIds.length) {
        const m = mergeAckIds(prev.support, supportIds);
        if (m.length !== prev.support.length) {
          support = m;
          changed = true;
        }
      }
      if (!changed) return prev;
      const next = { orders, drivers, support };
      saveAck(next);
      return next;
    });
  }, [hydrated, pathname, orderIds, driverIds, supportIds]);

  useEffect(() => {
    if (!hydrated || !notifLoaded) return;
    const prev = prevDisplayRef.current;
    if (prev === null) {
      prevDisplayRef.current = { ...display };
      return;
    }
    const increased =
      display.orders > prev.orders || display.drivers > prev.drivers || display.support > prev.support;
    if (increased) playAdminNotificationAlarm();
    prevDisplayRef.current = { ...display };
  }, [hydrated, notifLoaded, display]);

  const badgeFor = (key: AdminNavItem["badge"]) => {
    if (!key) return 0;
    if (key === "orders") return display.orders;
    if (key === "drivers") return display.drivers;
    return display.support;
  };

  return (
    <>
      {items.map(({ href, label, badge }) => {
        const n = badgeFor(badge);
        const active = pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm font-medium transition ${
              active ? "bg-[#0d2137] text-white" : "text-[#0d2137]/80 hover:bg-[#0d2137]/5 hover:text-[#0d2137]"
            }`}
          >
            <span>{label}</span>
            {n > 0 ? (
              <span
                className="admin-notif-badge flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white tabular-nums"
                aria-label={unreadBadgeAriaLabel(n)}
              >
                {n > 99 ? "99+" : n}
              </span>
            ) : null}
          </Link>
        );
      })}
    </>
  );
}
