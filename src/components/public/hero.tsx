import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

type Stat = { label: string; value: string };

type HeroProps = {
  clinicName: string;
  stats: Stat[];
};

export function HeroSection({ clinicName, stats }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-cyan-50">
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-teal-200/30 blur-3xl" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:px-6 lg:grid-cols-2 lg:py-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[var(--primary)] shadow-sm ring-1 ring-sky-100">
            <Sparkles className="h-3.5 w-3.5" />
            Premium dental care
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-[3.25rem]">
            Your Smile Deserves the Best Care
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600">
            Professional, compassionate and modern dental care for you and your family at {clinicName}.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/appointment" className="btn-primary gap-2">
              Book appointment
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/#services" className="btn-secondary">Explore services</Link>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="h-4 w-4 text-[var(--cta)]" />
            Sterile, modern equipment & painless care protocols
          </p>
        </div>

        <div className="relative">
          <div className="card-premium overflow-hidden p-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-sky-600 to-teal-500">
              <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                <p className="text-sm font-medium text-sky-100">Your trusted dental partner</p>
                <p className="mt-1 text-2xl font-bold">Comfort-first dentistry</p>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-100">
                <p className="text-lg font-bold text-[var(--primary)]">{s.value}</p>
                <p className="mt-1 text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
