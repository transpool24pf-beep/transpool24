import { AdminLocaleProvider } from "@/contexts/AdminLocaleContext";
import { AdminShell } from "./AdminShell";

export const metadata = {
  title: "TransPool24 – Admin",
  description: "Admin dashboard",
  robots: "noindex, nofollow",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLocaleProvider>
      <AdminShell>{children}</AdminShell>
    </AdminLocaleProvider>
  );
}
