import Link from "next/link";
import { TransformationCard } from "@/components/public/transformation-card";
import type { PublicTransformation } from "@/lib/public-transformations";

export function BeforeAfterSection({ cases }: { cases: PublicTransformation[] }) {
  const featured = cases.slice(0, 6);
  if (featured.length === 0) return null;

  return (
    <section id="results" className="scroll-mt-24 bg-gradient-to-b from-teal-50/40 via-white to-white py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">
            Before &amp; After
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Real Smile Transformations
          </h2>
          <p className="mt-3 text-base text-slate-600">
            See how personalized dental care can transform smiles.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((c) => (
            <TransformationCard key={c.id} item={c} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/transformations"
            className="inline-flex rounded-full border border-teal-200 bg-white px-6 py-2.5 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50"
          >
            View All Transformations →
          </Link>
        </div>
      </div>
    </section>
  );
}
