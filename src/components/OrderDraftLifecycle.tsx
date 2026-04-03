"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { clearOrderFormDraft, isOrderFlowPath } from "@/lib/order-form-draft";

/**
 * Clears the in-progress order draft when the user leaves the whole order area
 * (not only the form page). Locale-only changes keep the draft; /order → /order/confirm too.
 */
export function OrderDraftLifecycle() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;
    if (prev === null) return;
    if (isOrderFlowPath(prev) && !isOrderFlowPath(pathname)) {
      clearOrderFormDraft();
    }
  }, [pathname]);

  return null;
}
