import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Calendar } from "lucide-react";
import type { PublicDoctor } from "@/lib/public-doctor-types";

export function FeaturedDoctorSection({ doctor }: { doctor: PublicDoctor | null }) {
  if (!doctor) return null;

  const summary = doctor.summary?.trim() || doctor.bio;

  return (
    <section className="border-y border-sky-100 bg-gradient-to-br from-sky-50/80 to-white py-16">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:grid-cols-2 md:px-6">
        <div className="relative mx-auto w-full max-w-md">
          <div className="card-premium overflow-hidden shadow-lg">
            {doctor.image ? (
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src={doctor.image}
                  alt={doctor.name}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                />
              </div>
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-sky-100 to-teal-50 text-6xl">
                👨‍⚕️
              </div>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--cta)]">Featured doctor</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">{doctor.name}</h2>
          <p className="mt-3 text-lg font-semibold text-[var(--primary)]">{doctor.qualification}</p>
          <p className="mt-2 text-base italic text-slate-600">{doctor.specialization}</p>
          <p className="mt-4 text-sm font-semibold text-slate-700">{doctor.experienceYears}+ Years Experience</p>
          <p className="mt-4 text-base leading-relaxed text-slate-700 line-clamp-4">{summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/doctors/${doctor.slug}`} className="btn-secondary inline-flex items-center gap-2">
              View Profile
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/appointment?doctor=${encodeURIComponent(doctor.slug)}`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Book Appointment
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
