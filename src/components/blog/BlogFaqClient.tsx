"use client";

import { useState } from "react";

export type BlogFaqItem = { id: string; q: string; a: string };

export function BlogFaqClient({ items, title }: { items: BlogFaqItem[]; title: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  const mid = Math.ceil(items.length / 2);
  const colA = items.slice(0, mid);
  const colB = items.slice(mid);

  const Row = ({ item }: { item: BlogFaqItem }) => {
    const open = openId === item.id;
    return (
      <div className="border-b border-black/[0.08]">
        <button
          type="button"
          onClick={() => setOpenId(open ? null : item.id)}
          className="flex w-full items-start gap-3 py-4 text-start"
          aria-expanded={open}
        >
          <span className="mt-0.5 shrink-0 text-lg font-light text-[var(--accent)]" aria-hidden>
            {open ? "−" : "+"}
          </span>
          <span className="text-sm font-bold leading-snug text-[#1a1a1a] sm:text-base">{item.q}</span>
        </button>
        {open ? (
          <p className="pb-4 ps-9 text-sm leading-relaxed text-[#6b6b6b] sm:ps-10">{item.a}</p>
        ) : null}
      </div>
    );
  };

  return (
    <section className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-[#1a1a1a] sm:text-4xl">
          {title}
        </h2>
        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            {colA.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </div>
          <div>
            {colB.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
