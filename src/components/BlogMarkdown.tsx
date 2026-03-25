"use client";

import type { ImgHTMLAttributes } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = { markdown: string; className?: string };

function ArticleFigureImg(props: ImgHTMLAttributes<HTMLImageElement>) {
  const { src, alt, className, ...rest } = props;
  if (!src || typeof src !== "string") return null;
  return (
    <figure className="blog-md-figure group/fig my-10 overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-[#eef0f3] via-white to-[#e85d04]/[0.09] p-1.5 shadow-[0_28px_64px_-32px_rgba(0,0,0,0.42)] ring-1 ring-black/[0.07] transition-shadow duration-300 hover:shadow-[0_32px_72px_-28px_rgba(232,93,4,0.18)] sm:rounded-[1.65rem] sm:p-2 sm:[&:nth-of-type(3n+1)]:rotate-[-0.6deg] sm:[&:nth-of-type(3n+2)]:rotate-[0.5deg] sm:[&:nth-of-type(3n)]:rotate-[-0.35deg]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? ""}
        className={`h-auto w-full rounded-xl object-cover ring-1 ring-black/[0.05] sm:rounded-2xl ${className ?? ""}`}
        loading="lazy"
        {...rest}
      />
    </figure>
  );
}

export function BlogMarkdown({ markdown, className = "" }: Props) {
  return (
    <div
      className={`blog-md max-w-none text-[var(--foreground)] [&_h1]:mb-4 [&_h1]:mt-10 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:mb-4 [&_p]:leading-relaxed [&_a]:font-medium [&_a]:text-[var(--accent)] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-90 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_blockquote]:my-4 [&_blockquote]:border-s-4 [&_blockquote]:border-[#0d2137]/25 [&_blockquote]:ps-4 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-[#0d2137]/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-[#0d2137] [&_pre]:p-4 [&_pre]:text-sm [&_pre]:text-white [&_hr]:my-8 [&_hr]:border-[#0d2137]/15 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-[#0d2137]/15 [&_th]:bg-[#0d2137]/[0.04] [&_th]:px-3 [&_th]:py-2 [&_th]:text-start [&_td]:border [&_td]:border-[#0d2137]/15 [&_td]:px-3 [&_td]:py-2 ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ArticleFigureImg,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
