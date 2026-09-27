import { TransformationCard } from "@/components/public/transformation-card";
import { getPublicTransformations } from "@/lib/public-transformations";
import Link from "next/link";

export const metadata = {
  title: "Smile Transformations | Shiv Dental Clinic",
  description: "Before and after results from Shiv Dental Clinic with patient consent.",
};

export default async function TransformationsPage() {
  const cases = await getPublicTransformations(100);

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">
            Before &amp; After
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
            Real Smile Transformations
          </h1>
          <p className="mt-3 text-slate-600">
            See how personalized dental care can transform smiles. Only cases with documented patient
            consent are shown here.
          </p>
        </div>

        {cases.length === 0 ? (
          <p className="mt-12 text-slate-500">Transformations will appear here once published.</p>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {cases.map((c) => (
              <TransformationCard key={c.id} item={c} />
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
