import { WebsiteShell } from "./WebsiteShell";

export const metadata = {
  title: { absolute: "TransPool24 | نظام إدارة محتوى الموقع" },
  description: "إدارة محتوى transpool24.com (بدون الطلبات)",
  robots: "noindex, nofollow",
};

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return <WebsiteShell>{children}</WebsiteShell>;
}
