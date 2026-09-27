import Link from "next/link";
import { Award, Phone } from "lucide-react";

export type FeaturedDoctor = {
  id: string;
  name: string;
  qualification: string;
  specialization: string;
  experienceYears: number;
  bio: string;
  summary: string | null;
  registrationNumber: string | null;
  phone: string | null;
  image: string | null;
  consultationHours: string | null;
};

export function FeaturedDoctorSection({ doctor }: { doctor: FeaturedDoctor | null }) {
  if (!doctor) return null;

  const summary = doctor.summary?.trim() || doctor.bio;

  return (
    <section className="border-y border-sky-100 bg-white py-16">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:grid-cols-2 md:px-6">
        <div className="relative mx-auto w-full max-w-md">
          <div className="card-premium overflow-hidden">
            {doctor.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={doctor.image} alt={doctor.name} className="aspect-[4/5] w-full object-cover object-top" />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-sky-100 to-teal-50 text-sky-400">
                Doctor photo
              </div>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--cta)]">Lead dentist</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">{doctor.name}</h2>
          <p className="mt-2 text-lg font-medium text-[var(--primary)]">{doctor.specialization}</p>
          <p className="mt-1 text-sm text-slate-600">{doctor.qualification}</p>
          {doctor.registrationNumber && (
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <Award className="h-4 w-4" />
              Reg. No. {doctor.registrationNumber}
            </p>
          )}
          <p className="mt-5 text-base leading-relaxed text-slate-700">{summary}</p>
          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li>{doctor.experienceYears}+ years of clinical experience</li>
            <li>{doctor.consultationHours ?? "Consultation by appointment"}</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/appointment" className="btn-primary">
              Book with {doctor.name.split(" ").slice(-1)[0]}
            </Link>
            {doctor.phone && (
              <a href={`tel:${doctor.phone.replace(/\s/g, "")}`} className="btn-secondary gap-2">
                <Phone className="h-4 w-4" />
                Call clinic
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
