import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Phone } from "lucide-react";
import { shouldSkipStaticParamsAtBuild } from "@/lib/build-env";
import { getPublicDoctorBySlug, getPublicDoctors } from "@/lib/public-data";
import { formatWeeklyScheduleLines } from "@/lib/doctor-schedule";
import { getClinicSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  if (shouldSkipStaticParamsAtBuild()) return [];
  const doctors = await getPublicDoctors();
  return doctors.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doctor = await getPublicDoctorBySlug(slug);
  if (!doctor) return { title: "Doctor" };
  return {
    title: doctor.name,
    description: doctor.summary ?? doctor.bio.slice(0, 160),
  };
}

export default async function DoctorProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const doctor = await getPublicDoctorBySlug(slug);
  if (!doctor) notFound();

  const settings = await getClinicSettings();
  const phoneHref = settings.phone.replace(/\s/g, "");
  const waMessage = `Hi, I would like to book an appointment with ${doctor.name} at Shiv Dental Clinic.`;
  const expertise =
    doctor.areasOfExpertise.length > 0
      ? doctor.areasOfExpertise
      : ["General dentistry", "Preventive care", "Patient-friendly treatment"];

  return (
    <article className="pb-20 pt-10">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <Link href="/doctors" className="text-sm font-medium text-[var(--primary)] hover:underline">
          ← All doctors
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-5 lg:items-start">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 to-teal-50 shadow-lg lg:col-span-2">
            {doctor.image ? (
              <Image
                src={doctor.image}
                alt={doctor.name}
                fill
                className="object-cover object-top"
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl">👨‍⚕️</div>
            )}
          </div>

          <div className="lg:col-span-3">
            <h1 className="text-4xl font-bold text-slate-900">{doctor.name}</h1>
            <dl className="mt-6 space-y-4 text-slate-700">
              <div>
                <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">Qualification</dt>
                <dd className="mt-1 text-lg">{doctor.qualification}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">Specialization</dt>
                <dd className="mt-1 text-lg">{doctor.specialization}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">Experience</dt>
                <dd className="mt-1 text-lg">{doctor.experienceYears} Years</dd>
              </div>
            </dl>
          </div>
        </div>

        <section className="mt-12 card-premium p-8 md:p-10">
          <h2 className="text-2xl font-bold text-slate-900">About the Doctor</h2>
          <p className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-600">{doctor.bio}</p>
          {doctor.languagesSpoken && (
            <p className="mt-4 text-sm text-slate-600">
              <span className="font-semibold">Languages: </span>
              {doctor.languagesSpoken}
            </p>
          )}
        </section>

        <section className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="card-premium p-8">
            <h2 className="text-xl font-bold text-slate-900">Areas of Expertise</h2>
            <ul className="mt-5 space-y-3">
              {expertise.map((item) => (
                <li key={item} className="flex gap-3 text-slate-600">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-premium p-8">
            <h2 className="text-xl font-bold text-slate-900">Consultation Hours</h2>
            <pre className="mt-5 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-600">
              {formatWeeklyScheduleLines(doctor.weeklySchedule).join("\n")}
            </pre>
          </div>
        </section>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={`/appointment?doctor=${encodeURIComponent(doctor.slug)}`}
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
            WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}
