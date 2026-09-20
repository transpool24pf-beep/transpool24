import { Montserrat } from "next/font/google";
import { PageAdsLayout } from "@/components/ads/PageAdsLayout";
import { BlogHeader } from "@/components/BlogHeader";
import { BlogFooter } from "@/components/BlogFooter";

export const revalidate = 60;

const blogSans = Montserrat({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-blog-sans",
  display: "swap",
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${blogSans.variable} flex min-h-screen flex-col bg-white font-[family-name:var(--font-blog-sans),ui-sans-serif,system-ui,sans-serif] text-[#1a1a1a] antialiased`}
    >
      <BlogHeader />
      <PageAdsLayout className="flex-1 py-4">
        {children}
      </PageAdsLayout>
      <BlogFooter />
    </div>
  );
}
