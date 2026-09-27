import { TestimonialCard } from "@/components/public/testimonial-card";
import { getPublicTestimonials } from "@/lib/public-testimonials";
import Link from "next/link";
export const metadata = {
  title: "Patient Testimonials | Shiv Dental Clinic",
  description: "Read verified reviews from Shiv Dental Clinic patients.",
};

export default async function TestimonialsPage() {
  const testimonials = await getPublicTestimonials(100);

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">Testimonials</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">What Our Patients Say</h1>
          <p className="mt-3 text-slate-600">
            Real experiences from patients who trusted Shiv Dental Clinic.
          </p>
        </div>

        {testimonials.length === 0 ? (
          <p className="mt-12 text-slate-500">No testimonials published yet. Check back soon.</p>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} t={t} />
            ))}
          </div>
        )}

        <div className="mt-12">
          <Link
            href="/"
            className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
