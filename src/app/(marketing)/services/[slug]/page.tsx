import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceBySlug, getPublicServices } from "@/lib/public-data";
import { formatCurrency } from "@/lib/utils";
import { getClinicSettings } from "@/lib/settings";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const services = await getPublicServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: "Service" };
  return {
    title: service.name,
    description: service.shortDesc ?? service.description.slice(0, 160),
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const settings = await getClinicSettings();

  return (
    <article className="mx-auto max-w-4xl px-4 py-16 md:px-6">
      <Link href="/#services" className="text-sm font-medium text-[var(--primary)] hover:underline">
        ← All services
      </Link>
      <h1 className="mt-6 text-4xl font-bold text-slate-900">{service.name}</h1>
      {service.price != null && (
        <p className="mt-2 text-lg font-semibold text-[var(--cta)]">
          From {formatCurrency(service.price.toString())}
        </p>
      )}
      <div className="mt-8 card-premium p-8">
        <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">{service.description}</p>
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/appointment" className="btn-primary">Book this treatment</Link>
        <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="btn-secondary">Call {settings.phone}</a>
      </div>
    </article>
  );
}
