"use client";

import { AdminManualInvoiceForm } from "@/components/admin/AdminManualInvoiceForm";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";

export default function AdminExtractInvoicePage() {
  const { t } = useAdminLocale();
  return (
    <div className="space-y-4 text-start">
      <h1 className="text-2xl font-bold text-[#0d2137]">{t("reports.extractInvoice")}</h1>
      <p className="text-sm text-[#0d2137]/70">{t("reports.extractInvoiceDesc")}</p>
      <div className="rounded-2xl border-2 border-[#0d2137]/15 bg-white p-6 shadow-lg">
        <AdminManualInvoiceForm />
      </div>
    </div>
  );
}
