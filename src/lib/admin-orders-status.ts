import type { AdminLocale } from "@/lib/admin-ui-strings";

/** Active execution — until delivered/cancelled/draft excluded from this board */
export const ADMIN_IN_PROGRESS_STATUS_SET = new Set(["confirmed", "paid", "assigned", "in_transit"]);

export const ADMIN_ORDER_STATUS_CONFIG: Record<
  string,
  { labelDe: string; labelAr: string; color: string; bg: string; pillBorder: string }
> = {
  draft: {
    labelDe: "Entwurf",
    labelAr: "مسودة",
    color: "text-slate-700",
    bg: "bg-slate-400",
    pillBorder: "border-slate-400/70",
  },
  confirmed: {
    labelDe: "Bestätigt",
    labelAr: "مؤكد",
    color: "text-blue-700",
    bg: "bg-blue-500",
    pillBorder: "border-blue-400/80",
  },
  paid: {
    labelDe: "Bezahlt",
    labelAr: "مدفوع",
    color: "text-emerald-700",
    bg: "bg-emerald-500",
    pillBorder: "border-emerald-500/75",
  },
  assigned: {
    labelDe: "Zugewiesen",
    labelAr: "مُعيَّن",
    color: "text-amber-700",
    bg: "bg-amber-500",
    pillBorder: "border-amber-500/75",
  },
  in_transit: {
    labelDe: "Unterwegs",
    labelAr: "في الطريق",
    color: "text-violet-700",
    bg: "bg-violet-500",
    pillBorder: "border-violet-500/75",
  },
  delivered: {
    labelDe: "Zugestellt",
    labelAr: "تم التوصيل",
    color: "text-green-700",
    bg: "bg-green-500",
    pillBorder: "border-green-500/80",
  },
  cancelled: {
    labelDe: "Storniert",
    labelAr: "ملغى",
    color: "text-red-700",
    bg: "bg-red-500",
    pillBorder: "border-red-500/80",
  },
};

export function adminOrderStatusText(locale: AdminLocale, logisticsStatus: string) {
  const c = ADMIN_ORDER_STATUS_CONFIG[logisticsStatus] ?? ADMIN_ORDER_STATUS_CONFIG.draft;
  return locale === "ar" ? c.labelAr : c.labelDe;
}
