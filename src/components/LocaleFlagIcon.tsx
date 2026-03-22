"use client";

import Image from "next/image";
import type { Locale } from "@/i18n/routing";
import { LOCALE_EMOJI_FLAG } from "@/lib/locale-display";

const FLAG_BOX = "h-[14px] w-5 shrink-0";

type Props = { locale: Locale; className?: string };

/** Flag emoji or Kurdish image; same visual box as other flags. */
export function LocaleFlagIcon({ locale, className }: Props) {
  if (locale === "ku") {
    return (
      <Image
        src="/399.png.png"
        alt=""
        width={20}
        height={14}
        className={`${FLAG_BOX} rounded-[2px] object-cover ${className ?? ""}`}
        unoptimized
      />
    );
  }
  return (
    <span
      className={`flex ${FLAG_BOX} items-center justify-center text-[15px] leading-none ${className ?? ""}`}
      aria-hidden
    >
      {LOCALE_EMOJI_FLAG[locale]}
    </span>
  );
}
