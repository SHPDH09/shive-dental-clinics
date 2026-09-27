"use client";

import { useEffect, useState } from "react";
import type { PublicHeroSlide } from "@/lib/hero-slides";
import { cn } from "@/lib/utils";

export function HeroCarousel({ slides }: { slides: PublicHeroSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-sky-600 to-teal-500">
        <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
          <p className="text-sm font-medium text-sky-100">Your trusted dental partner</p>
          <p className="mt-1 text-2xl font-bold">Comfort-first dentistry</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-900">
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === index ? "opacity-100" : "opacity-0",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.imageUrl} alt={s.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
            {s.subtitle && <p className="text-sm font-medium text-sky-100">{s.subtitle}</p>}
            <p className="mt-1 text-xl font-bold md:text-2xl">{s.title}</p>
          </div>
        </div>
      ))}
      {slides.length > 1 && (
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              className={cn(
                "h-2 w-2 rounded-full",
                i === index ? "bg-white" : "bg-white/40",
              )}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
