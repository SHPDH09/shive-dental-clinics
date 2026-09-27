import { BadgeCheck, Star } from "lucide-react";
import { format } from "date-fns";
import type { PublicTestimonial } from "@/lib/public-testimonials";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TestimonialCard({ t, className = "" }: { t: PublicTestimonial; className?: string }) {
  return (
    <article
      className={`card-premium flex h-full flex-col p-6 transition-shadow hover:shadow-lg ${className}`}
    >
      <div className="flex items-start gap-4">
        {t.patientImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={t.patientImage}
            alt={t.patientName}
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-teal-100"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-sm font-bold text-white ring-2 ring-teal-100">
            {initials(t.patientName)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{t.patientName}</p>
            {t.verifiedPatient && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-800">
                <BadgeCheck className="h-3 w-3" aria-hidden />
                Verified Patient
              </span>
            )}
          </div>
          {t.treatment && (
            <p className="mt-0.5 text-xs font-medium text-teal-700">{t.treatment}</p>
          )}
          <p className="mt-1 text-[11px] text-slate-400">
            {format(new Date(t.testimonialDate), "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-0.5 text-amber-400" aria-label={`${t.rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < t.rating ? "fill-current" : "fill-slate-200 text-slate-200"}`}
          />
        ))}
      </div>

      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
        &ldquo;{t.testimonial}&rdquo;
      </blockquote>
    </article>
  );
}
