import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  slug: string;
  shortDesc: string | null;
  description: string;
  price: { toString(): string } | null;
};

export function ServicesSection({ services }: { services: Service[] }) {
  return (
    <section id="services" className="scroll-mt-24 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="max-w-2xl">
          <h2 className="section-title">Our dental services</h2>
          <p className="section-subtitle">
            From routine checkups to advanced cosmetic treatments — personalized care for every smile.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.id}
              className="group card-premium flex flex-col p-6 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-lg font-bold text-[var(--primary)]">
                {service.name.charAt(0)}
              </div>
              <h3 className="text-lg font-bold text-slate-900">{service.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                {service.shortDesc ?? service.description.slice(0, 120)}
              </p>
              {service.price != null && (
                <p className="mt-3 text-sm font-semibold text-[var(--cta)]">
                  From {formatCurrency(service.price.toString())}
                </p>
              )}
              <Link
                href={`/services/${service.slug}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] group-hover:gap-2 transition-all"
              >
                Learn more
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
