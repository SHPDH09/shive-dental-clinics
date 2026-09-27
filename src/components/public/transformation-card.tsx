"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { format } from "date-fns";
import { BeforeAfterSlider } from "@/components/public/before-after-slider";
import { transformationCategoryLabel } from "@/lib/transformation-categories";
import type { PublicTransformation } from "@/lib/public-transformations";

export function TransformationCard({ item }: { item: PublicTransformation }) {
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
      <article className="card-premium overflow-hidden transition hover:shadow-xl">
        <button type="button" className="block w-full text-left" onClick={() => setLightbox(true)}>
          <BeforeAfterSlider beforeSrc={item.beforeImage} afterSrc={item.afterImage} />
        </button>
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              {transformationCategoryLabel(item.category)}
            </p>
            {item.verifiedCase && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                <BadgeCheck className="h-3 w-3 text-teal-600" />
                Verified case
              </span>
            )}
          </div>
          <h3 className="mt-2 text-lg font-bold text-slate-900">{item.treatment}</h3>
          {item.description && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            {item.treatmentDuration && <span>Duration: {item.treatmentDuration}</span>}
            <span>{format(new Date(item.caseDate), "MMM d, yyyy")}</span>
          </div>
        </div>
      </article>

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <BeforeAfterSlider beforeSrc={item.beforeImage} afterSrc={item.afterImage} />
            <p className="mt-4 text-center text-white">{item.treatment}</p>
            <button
              type="button"
              className="mt-4 w-full rounded-full bg-white/10 py-2 text-sm text-white"
              onClick={() => setLightbox(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
