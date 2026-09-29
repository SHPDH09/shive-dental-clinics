import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import type { PublicHeroSlide } from "@/lib/hero-slides";
import { CLINIC_STOREFRONT_BG } from "@/lib/branding";
import { HeroCarousel } from "@/components/public/hero-carousel";

type Stat = { label: string; value: string };

type HeroProps = {
  clinicName: string;
  stats: Stat[];
  slides?: PublicHeroSlide[];
  backgroundImageUrl?: string;
};

export function HeroSection({
  clinicName,
  stats,
  slides = [],
  backgroundImageUrl = CLINIC_STOREFRONT_BG,
}: HeroProps) {
  const bgUrl = backgroundImageUrl.trim() || CLINIC_STOREFRONT_BG;

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${bgUrl.replace(/"/g, "%22")}")` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/95 via-white/88 to-white/72 md:from-white/92 md:via-white/78 md:to-white/55"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[var(--primary)]/10" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:px-6 lg:grid-cols-2 lg:py-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-1.5 text-xs font-semibold text-[var(--primary)] shadow-sm ring-1 ring-sky-100 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Premium dental care
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-[3.25rem]">
            {clinicName} — Your Smile Deserves the Best Care
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-700">
            Trusted dentists for implants, root canal, teeth whitening, braces & family dentistry — book online or
            walk in for compassionate, modern care.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/appointment" className="btn-primary gap-2">
              Book appointment
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/#services" className="btn-secondary">
              Explore services
            </Link>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-slate-600">
            <ShieldCheck className="h-4 w-4 text-[var(--cta)]" />
            Sterile, modern equipment & painless care protocols
          </p>
        </div>

        <div className="relative">
          <div className="card-premium overflow-hidden bg-white/95 p-2 backdrop-blur-sm">
            <HeroCarousel slides={slides} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl bg-white/95 p-4 text-center shadow-sm ring-1 ring-slate-100 backdrop-blur-sm"
              >
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
