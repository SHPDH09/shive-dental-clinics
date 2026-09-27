import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Calendar, Clock } from "lucide-react";
import type { PublicDoctor } from "@/lib/public-doctor-types";

export function DoctorCard({ doctor }: { doctor: PublicDoctor }) {
  const intro = doctor.summary?.trim() || doctor.bio.slice(0, 140);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-sky-50 to-teal-50 sm:aspect-[3/4]">
        {doctor.image ? (
          <Image
            src={doctor.image}
            alt={doctor.name}
            fill
            className="object-cover object-top transition duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">👨‍⚕️</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-sky-800 backdrop-blur">
          {doctor.specialization}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold text-slate-900">{doctor.name}</h3>
        <p className="mt-1 text-sm font-medium text-slate-600">{doctor.qualification}</p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{intro}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {doctor.experienceYears}+ years experience
        </p>
        {doctor.consultationHours && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5 text-sky-500" />
            {doctor.consultationHours}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/doctors/${doctor.slug}`}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[var(--primary)] transition hover:border-sky-200 hover:bg-sky-50"
          >
            View Profile
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/appointment?doctor=${encodeURIComponent(doctor.slug)}`}
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
