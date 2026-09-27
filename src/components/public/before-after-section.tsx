type Case = {
  id: string;
  treatment: string;
  beforeImage: string;
  afterImage: string;
  description: string | null;
};

export function BeforeAfterSection({ cases }: { cases: Case[] }) {
  if (cases.length === 0) return null;

  return (
    <section id="results" className="scroll-mt-24 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="section-title">Before & after</h2>
        <p className="section-subtitle">Transformations we are proud to share (with patient consent).</p>
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {cases.map((c) => (
            <article key={c.id} className="card-premium overflow-hidden p-4">
              <h3 className="mb-4 font-semibold text-slate-900">{c.treatment}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-slate-500">Before</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.beforeImage} alt="Before" className="aspect-[4/3] w-full rounded-xl object-cover" />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-slate-500">After</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.afterImage} alt="After" className="aspect-[4/3] w-full rounded-xl object-cover" />
                </div>
              </div>
              {c.description && <p className="mt-3 text-sm text-slate-600">{c.description}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
