import Image from "next/image";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
};

/**
 * CMS URLs are often full Supabase HTTPS links. Using <img> avoids Next/Image
 * remotePatterns mismatches (e.g. build-time env) and loads reliably on Safari/macOS.
 */
export function WhyCmsImage({ src, alt = "", className = "", fill, sizes, priority }: Props) {
  const s = (src || "").trim();
  if (!s) {
    return (
      <div
        className={`bg-[#0d2137]/10 ${fill ? "absolute inset-0 h-full w-full" : ""} ${className}`}
        aria-hidden
      />
    );
  }

  const remote = s.startsWith("http://") || s.startsWith("https://");
  if (remote) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover ${className}`}
          decoding="async"
          referrerPolicy="no-referrer"
          {...(priority ? { fetchPriority: "high" as const } : {})}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={s}
        alt={alt}
        className={className}
        decoding="async"
        referrerPolicy="no-referrer"
        {...(priority ? { fetchPriority: "high" as const } : {})}
      />
    );
  }

  if (fill) {
    return (
      <Image src={s} alt={alt} fill className={className} sizes={sizes} priority={priority} />
    );
  }

  return <Image src={s} alt={alt} width={1200} height={630} className={className} />;
}
