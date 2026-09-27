import { Star } from "lucide-react";

type Testimonial = {
  id: string;
  patientName: string;
  rating: number;
  testimonial: string;
  treatment: string | null;
};

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="scroll-mt-24 bg-sky-50/50 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="section-title">Patient stories</h2>
        <p className="section-subtitle">Real feedback from people who trust us with their smiles.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <blockquote key={t.id} className="card-premium p-6">
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">&ldquo;{t.testimonial}&rdquo;</p>
              <footer className="mt-4 border-t border-slate-100 pt-4">
                <p className="font-semibold text-slate-900">{t.patientName}</p>
                {t.treatment && <p className="text-xs text-slate-500">{t.treatment}</p>}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
