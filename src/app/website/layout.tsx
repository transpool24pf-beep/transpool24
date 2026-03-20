import { WebsiteShell } from "./WebsiteShell";

export const metadata = {
  title: "TransPool24 – Website CMS",
  description: "Verwaltung von Inhalten auf transpool24.com (ohne Aufträge)",
  robots: "noindex, nofollow",
};

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return <WebsiteShell>{children}</WebsiteShell>;
}
