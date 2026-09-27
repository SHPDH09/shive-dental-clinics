import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MapPin, Navigation, Phone } from "lucide-react";
import { shouldSkipStaticParamsAtBuild } from "@/lib/build-env";
import {
  branchDirectionsUrl,
  branchOpeningLines,
  getPublicBranchBySlug,
  getPublicBranches,
} from "@/lib/public-data";
import { getClinicSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  if (shouldSkipStaticParamsAtBuild()) return [];
  const branches = await getPublicBranches();
  return branches.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const branch = await getPublicBranchBySlug(slug);
  if (!branch) return { title: "Branch" };
  return { title: branch.name, description: branch.fullAddress };
}

export default async function BranchDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const branch = await getPublicBranchBySlug(slug);
  if (!branch) notFound();

  const settings = await getClinicSettings();
  const directions = branchDirectionsUrl(branch);
  const phoneHref = branch.phone.replace(/\s/g, "");

  return (
    <article className="pb-20 pt-10">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <Link href="/branches" className="text-sm font-medium text-[var(--primary)] hover:underline">
          ← All locations
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 to-teal-50 shadow-lg">
            {branch.image ? (
              <Image src={branch.image} alt={branch.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 50vw" />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl">📍</div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">{settings.clinicName}</p>
            <h1 className="mt-2 text-4xl font-bold text-slate-900">{branch.name}</h1>
            <p className="mt-4 flex gap-2 text-slate-600">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-sky-500" />
              {branch.fullAddress}
            </p>
            <p className="mt-4 text-lg">
              <Phone className="mr-2 inline h-5 w-5 text-sky-500" />
              <a href={`tel:${phoneHref}`} className="font-semibold text-slate-900 hover:underline">
                {branch.phone}
              </a>
            </p>
            <p className="mt-2">
              <a
                href={whatsappLink(branch.whatsapp, `Hi, I have a question about ${branch.name}.`)}
                className="font-semibold text-teal-700 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp this branch
              </a>
            </p>
          </div>
        </div>

        <section className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="card-premium p-8">
            <h2 className="text-xl font-bold text-slate-900">Opening Hours</h2>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-600">
              {branchOpeningLines(branch).join("\n")}
            </pre>
          </div>
          <div className="card-premium p-8">
            <h2 className="text-xl font-bold text-slate-900">Doctors Available</h2>
            <ul className="mt-4 space-y-2">
              {branch.doctors.length === 0 ? (
                <li className="text-sm text-slate-500">Call the clinic for doctor availability.</li>
              ) : (
                branch.doctors.map((d) => (
                  <li key={d.id} className="flex gap-2 text-slate-700">
                    <Check className="h-4 w-4 shrink-0 text-teal-600" />
                    <Link href={`/doctors/${d.slug}`} className="hover:text-[var(--primary)] hover:underline">
                      {d.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <section className="mt-8 card-premium p-8">
          <h2 className="text-xl font-bold text-slate-900">Services Available</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {branch.services.length === 0 ? (
              <li className="text-sm text-slate-500">Full range of dental services — call to confirm.</li>
            ) : (
              branch.services.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-900 hover:bg-sky-100"
                  >
                    {s.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>

        {(branch.mapEmbedUrl || branch.latitude) && (
          <section className="mt-10 overflow-hidden rounded-2xl border border-slate-200">
            {branch.mapEmbedUrl ? (
              <iframe
                title="Clinic location map"
                src={branch.mapEmbedUrl}
                className="h-80 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <iframe
                title="Clinic location map"
                className="h-80 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(branch.fullAddress)}&output=embed`}
              />
            )}
          </section>
        )}

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href={`/appointment?branch=${encodeURIComponent(branch.slug)}`} className="btn-primary text-center">
            Book Appointment
          </Link>
          <a href={directions} target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center justify-center gap-2">
            <Navigation className="h-4 w-4" />
            Get Directions
          </a>
          <a href={`tel:${phoneHref}`} className="btn-secondary inline-flex items-center justify-center gap-2">
            <Phone className="h-4 w-4" />
            Call Clinic
          </a>
        </div>
      </div>
    </article>
  );
}
