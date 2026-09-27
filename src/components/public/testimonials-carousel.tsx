"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TestimonialCard } from "@/components/public/testimonial-card";
import type { PublicTestimonial } from "@/lib/public-testimonials";
import { Button } from "@/components/ui/button";

export function TestimonialsCarousel({ testimonials }: { testimonials: PublicTestimonial[] }) {
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(1);

  useEffect(() => {
    const update = () => setPerView(window.innerWidth >= 1024 ? 3 : 1);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = Math.max(0, testimonials.length - perView);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const next = useCallback(() => {
    setIndex((i) => Math.min(maxIndex, i + 1));
  }, [maxIndex]);

  if (testimonials.length === 0) return null;

  const visible = testimonials.slice(index, index + perView);

  return (
    <div className="relative mt-12">
      <div className="grid gap-6 lg:grid-cols-3">
        {visible.map((t) => (
          <TestimonialCard key={t.id} t={t} />
        ))}
      </div>

      {testimonials.length > perView && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button type="button" variant="secondary" size="sm" onClick={prev} disabled={index === 0} aria-label="Previous" className="!rounded-full !px-3">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-1.5">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-teal-600" : "w-2 bg-slate-300"
                }`}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={next}
            disabled={index >= maxIndex}
            aria-label="Next"
            className="!rounded-full !px-3"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
