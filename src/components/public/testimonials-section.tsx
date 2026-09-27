import Link from "next/link";
import { TestimonialsCarousel } from "@/components/public/testimonials-carousel";
import type { PublicTestimonial } from "@/lib/public-testimonials";

export function TestimonialsSection({ testimonials }: { testimonials: PublicTestimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="scroll-mt-24 bg-gradient-to-b from-slate-50 via-white to-teal-50/30 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">Testimonials</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            What Our Patients Say
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Real experiences from patients who trusted Shiv Dental Clinic.
          </p>
        </div>

        <TestimonialsCarousel testimonials={testimonials} />

        <div className="mt-10 flex justify-center">
          <Link
            href="/testimonials"
            className="inline-flex items-center justify-center rounded-full border border-teal-200 bg-white px-6 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-50"
          >
            View All Testimonials
          </Link>
        </div>
      </div>
    </section>
  );
}
