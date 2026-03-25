import Image from "next/image";
import Link from "next/link";
import type { BlogPostCard } from "@/lib/blog";
import { IconCalendar, IconUser } from "@/components/blog/BlogNewsIcons";

type Props = {
  post: BlogPostCard;
  href: string;
  dateLabel: string;
  byAuthorLabel: string;
  readMoreLabel: string;
};

export function BlogNewsCard({ post, href, dateLabel, byAuthorLabel, readMoreLabel }: Props) {
  return (
    <article className="group flex h-full flex-col">
      <Link href={href} className="block shrink-0 overflow-hidden rounded-xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.04] transition duration-300 hover:shadow-[0_20px_40px_-16px_rgba(232,93,4,0.25)]">
        <div className="relative aspect-[16/11] bg-[#e8eaed]">
          {post.featured_image_url ? (
            <Image
              src={post.featured_image_url}
              alt=""
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized={post.featured_image_url.startsWith("http")}
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a]/[0.07] via-[#e85d04]/10 to-[#1a1a1a]/[0.04]"
              aria-hidden
            />
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col pt-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#5c5c5c]">
          <span className="inline-flex items-center gap-2">
            <IconCalendar className="h-4 w-4 shrink-0 text-[var(--accent)]" />
            <time dateTime={post.published_at ?? undefined} className="font-medium">
              {dateLabel}
            </time>
          </span>
          <span className="inline-flex items-center gap-2">
            <IconUser className="h-4 w-4 shrink-0 text-[var(--accent)]" />
            <span className="font-medium">{byAuthorLabel}</span>
          </span>
        </div>

        <h2 className="mt-4 text-lg font-bold leading-snug tracking-tight text-[#1a1a1a] sm:text-xl">
          <Link href={href} className="transition-colors hover:text-[var(--accent)]">
            {post.title}
          </Link>
        </h2>

        {post.excerpt ? (
          <p className="mt-3 line-clamp-3 flex-1 text-[15px] leading-relaxed text-[#6b6b6b]">{post.excerpt}</p>
        ) : (
          <div className="flex-1" />
        )}

        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-[var(--accent)] transition hover:gap-3"
        >
          {readMoreLabel}
          <span className="text-base leading-none" aria-hidden>
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
