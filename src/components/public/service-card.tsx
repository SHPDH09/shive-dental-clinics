import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Calendar, Clock } from "lucide-react";
import type { PublicService } from "@/lib/public-service-types";
import { formatCurrency } from "@/lib/utils";

type Props = {
  service: PublicService;
  variant?: "default" | "featured";
};

export function ServiceCard({ service, variant = "default" }: Props) {
  const intro = service.shortDesc ?? service.description.slice(0, 140);
  const showPrice = service.price && !service.hidePrice;

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
        variant === "featured" ? "ring-1 ring-sky-100" : ""
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-sky-50 to-teal-50">
        {service.image ? (
          <Image
            src={service.image}
            alt={service.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">{service.icon ?? "🦷"}</div>
        )}
        {service.categoryName && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
            {service.categoryName}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-bold text-slate-900">{service.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{intro}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
          {service.treatmentDuration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-sky-500" />
              {service.treatmentDuration}
            </span>
          )}
          {showPrice && (
            <span className="text-[var(--cta)]">From {formatCurrency(service.price)}</span>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            href={`/services/${service.slug}`}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[var(--primary)] transition hover:border-sky-200 hover:bg-sky-50"
          >
            Learn More
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/appointment?service=${encodeURIComponent(service.slug)}`}
            className="btn-primary inline-flex flex-1 items-center justify-center gap-2 py-2.5 text-sm"
          >
            <Calendar className="h-4 w-4" />
            Book Appointment
          </Link>
        </div>
      </div>
    </article>
  );
}
