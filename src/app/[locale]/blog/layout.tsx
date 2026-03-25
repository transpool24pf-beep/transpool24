import { BlogHeader } from "@/components/BlogHeader";
import { BlogFooter } from "@/components/BlogFooter";

export const revalidate = 60;

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f8] text-[#1a1a1a] antialiased">
      <BlogHeader />
      <div className="flex-1">{children}</div>
      <BlogFooter />
    </div>
  );
}
