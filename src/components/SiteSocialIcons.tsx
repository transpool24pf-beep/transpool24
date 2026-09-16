"use client";

import { useEffect, useState } from "react";
import type { SiteSocialMediaPayload } from "@/lib/site-social-media";

const FALLBACK_LINKEDIN = "https://www.linkedin.com/in/trans-pool-1235803b8";
const FALLBACK_INSTAGRAM = "https://www.instagram.com/transpool24/";

type Kind = "ig" | "tt" | "li" | "fb" | "yt";
type Row = { href: string; label: string; icon: Kind };

function glyph(kind: Kind, className: string) {
  switch (kind) {
    case "li":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "ig":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    case "tt":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25v-.71h-2.73v13.54a2.91 2.91 0 01-2.91 2.9 2.91 2.91 0 01-2.64-1.72 2.9 2.9 0 012.48-4.05v-2.78a5.72 5.72 0 00-1-.1 5.73 5.73 0 00-5.73 5.73A5.73 5.73 0 0012 22.91 5.73 5.73 0 0017.73 17.18V9.43a7.25 7.25 0 004.25 1.37v-2.78a4.81 4.81 0 01-2.39-.33z" />
        </svg>
      );
    case "fb":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.56 12 3.56 12 3.56s-7.54 0-9.38.49A3.02 3.02 0 00.5 6.19 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.84.49 9.38.49 9.38.49s7.54 0 9.38-.49a3.02 3.02 0 002.12-2.14A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
        </svg>
      );
  }
}

function rowsFromSocial(social: SiteSocialMediaPayload | null): Row[] {
  const cms: Row[] = [];
  if (social?.instagramUrl) cms.push({ href: social.instagramUrl, label: "Instagram", icon: "ig" });
  if (social?.tiktokUrl) cms.push({ href: social.tiktokUrl, label: "TikTok", icon: "tt" });
  if (social?.linkedinUrl) cms.push({ href: social.linkedinUrl, label: "LinkedIn", icon: "li" });
  if (social?.facebookUrl) cms.push({ href: social.facebookUrl, label: "Facebook", icon: "fb" });
  if (social?.youtubeUrl) cms.push({ href: social.youtubeUrl, label: "YouTube", icon: "yt" });
  if (cms.length > 0) return cms;
  return [
    { href: FALLBACK_LINKEDIN, label: "LinkedIn", icon: "li" },
    { href: FALLBACK_INSTAGRAM, label: "Instagram", icon: "ig" },
  ];
}

export function SiteSocialIcons({
  className,
  iconClassName = "h-4 w-4",
  linkClassName = "text-[#2d2d2d]/70 transition hover:text-[var(--accent)]",
}: {
  className?: string;
  iconClassName?: string;
  linkClassName?: string;
}) {
  const [social, setSocial] = useState<SiteSocialMediaPayload | null>(null);

  useEffect(() => {
    fetch("/api/public/social-media")
      .then((r) => r.json())
      .then((d: { social?: SiteSocialMediaPayload }) => setSocial(d.social ?? null))
      .catch(() => setSocial(null));
  }, []);

  const rows = rowsFromSocial(social);

  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      {rows.map((row) => (
        <a
          key={row.icon + row.href}
          href={row.href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
          aria-label={row.label}
        >
          {glyph(row.icon, iconClassName)}
        </a>
      ))}
    </div>
  );
}
