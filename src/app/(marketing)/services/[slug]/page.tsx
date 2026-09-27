import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Phone } from "lucide-react";
import { getPublicServices, getServiceBySlug } from "@/lib/public-data";
import { formatCurrency, whatsappLink } from "@/lib/utils";
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
  const phoneHref = settings.phone.replace(/\s/g, "");
  const waMessage = `Hi, I would like to book ${service.name} at Shiv Dental Clinic.`;
  const intro = service.shortDesc ?? service.description.slice(0, 240);
  const whatIs = service.whatIsTreatment ?? service.description;
  const benefits =
    service.benefits.length > 0
      ? service.benefits
      : ["Comfort-focused care", "Clear explanation before treatment", "Follow-up guidance for healing"];
  const steps =
    service.treatmentSteps.length > 0
      ? service.treatmentSteps
      : ["Consultation", "Diagnosis", "Treatment", "Follow-up"];

  return (
    <article className="pb-20 pt-10">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <Link href="/services" className="text-sm font-medium text-[var(--primary)] hover:underline">
          ← All services
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 to-teal-50 shadow-lg">
            {service.image ? (
              <Image src={service.image} alt={service.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 50vw" />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl">{service.icon ?? "🦷"}</div>
            )}
          </div>

          <div>
            {service.categoryName && (
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">{service.categoryName}</p>
            )}
            <h1 className="mt-2 text-4xl font-bold text-slate-900">{service.name}</h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{intro}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              {service.treatmentDuration && (
                <span className="rounded-full bg-slate-100 px-4 py-2 font-medium text-slate-700">
                  Duration: {service.treatmentDuration}
                </span>
              )}
              {service.price && !service.hidePrice && (
                <span className="rounded-full bg-teal-50 px-4 py-2 font-semibold text-teal-800">
                  Starting {formatCurrency(service.price)}
                </span>
              )}
            </div>
          </div>
        </div>

        <section className="mt-14 card-premium p-8 md:p-10">
          <h2 className="text-2xl font-bold text-slate-900">What is this treatment?</h2>
          <p className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-600">{whatIs}</p>
        </section>

        <section className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="card-premium p-8">
            <h2 className="text-xl font-bold text-slate-900">Benefits</h2>
            <ul className="mt-5 space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex gap-3 text-slate-600">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-premium p-8">
            <h2 className="text-xl font-bold text-slate-900">Treatment Process</h2>
            <ol className="mt-5 space-y-3">
              {steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-slate-600">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {service.faqs.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <div className="mt-6 space-y-4">
              {service.faqs.map((faq) => (
                <details key={faq.question} className="group card-premium p-5">
                  <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:content-none">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={`/appointment?service=${encodeURIComponent(service.slug)}`}
            className="btn-primary text-center"
          >
            Book Appointment
          </Link>
          <a href={`tel:${phoneHref}`} className="btn-secondary inline-flex items-center justify-center gap-2">
            <Phone className="h-4 w-4" />
            Call Clinic
          </a>
          <a
            href={whatsappLink(settings.whatsapp || settings.phone, waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-center"
          >
            WhatsApp Us
          </a>
        </div>
      </div>
    </article>
  );
}
