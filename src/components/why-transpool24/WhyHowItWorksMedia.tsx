"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { resolveWhyVideoEmbed } from "@/lib/why-video-embed";

type Props = {
  sceneImageUrl: string;
  howVideoUrl: string;
};

export function WhyHowItWorksMedia({ sceneImageUrl, howVideoUrl }: Props) {
  const [iframeOn, setIframeOn] = useState(false);
  const embed = useMemo(() => resolveWhyVideoEmbed(howVideoUrl), [howVideoUrl]);

  const unoptimizedImg = sceneImageUrl.startsWith("http");

  if (embed.kind === "file") {
    return (
      <div className="relative aspect-[4/3] min-h-[220px] overflow-hidden rounded-2xl ring-2 ring-white/20 shadow-xl">
        <video
          src={embed.src}
          poster={sceneImageUrl}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (embed.kind === "youtube" || embed.kind === "vimeo") {
    return (
      <div className="relative aspect-[4/3] min-h-[220px] overflow-hidden rounded-2xl ring-2 ring-white/20 shadow-xl">
        {!iframeOn ? (
          <>
            <Image
              src={sceneImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              unoptimized={unoptimizedImg}
            />
            <div className="absolute inset-0 bg-[#0d2137]/25" />
            <button
              type="button"
              onClick={() => setIframeOn(true)}
              className="absolute inset-0 flex items-center justify-center transition hover:bg-[#0d2137]/10"
              aria-label="Video abspielen"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-xl ring-4 ring-white/30 transition hover:scale-105">
                <svg className="ms-1 h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </button>
          </>
        ) : (
          <iframe
            title="TransPool24 Video"
            src={
              embed.kind === "youtube"
                ? `${embed.src}${embed.src.includes("?") ? "&" : "?"}autoplay=1`
                : `${embed.src}${embed.src.includes("?") ? "&" : "?"}autoplay=1&muted=1`
            }
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] min-h-[220px] overflow-hidden rounded-2xl ring-2 ring-white/20 shadow-xl">
      <Image
        src={sceneImageUrl}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 50vw"
        unoptimized={unoptimizedImg}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-[#0d2137]/20">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/90 text-white shadow-xl ring-4 ring-white/30">
          <svg className="ms-1 h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
    </div>
  );
}
