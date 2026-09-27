import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublicService } from "@/lib/public-service-types";
import { ServiceCard } from "@/components/public/service-card";

type Props = {
  services: PublicService[];
  /** When true, show only featured services (fallback to first six if none). */
  featuredOnly?: boolean;
};

export function ServicesSection({ services, featuredOnly = true }: Props) {
  const featured = services.filter((s) => s.featured);
  const display = featuredOnly
    ? featured.length > 0
      ? featured.slice(0, 6)
      : services.slice(0, 6)
    : services;

  return (
    <section id="services" className="scroll-mt-24 bg-gradient-to-b from-white to-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="section-title">Our Dental Services</h2>
            <p className="section-subtitle">
              Professional dental treatments designed around your comfort, health and smile.
            </p>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:gap-3 transition-all"
          >
            View All Services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {display.map((service) => (
            <ServiceCard key={service.id} service={service} variant={service.featured ? "featured" : "default"} />
          ))}
        </div>

        {display.length === 0 && (
          <p className="mt-8 text-center text-slate-500">Services will appear here soon.</p>
        )}
      </div>
    </section>
  );
}
