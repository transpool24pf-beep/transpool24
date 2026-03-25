import { BlogHeader } from "@/components/BlogHeader";
import { BlogFooter } from "@/components/BlogFooter";

export const revalidate = 60;

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f9] text-[#0d2137] antialiased">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 0%, rgba(232,93,4,0.08) 0%, transparent 45%),
            radial-gradient(circle at 80% 20%, rgba(13,33,55,0.06) 0%, transparent 40%)`,
        }}
        aria-hidden
      />
      <BlogHeader />
      <div className="flex-1">{children}</div>
      <BlogFooter />
    </div>
  );
}
