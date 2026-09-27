import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, MapPin, Navigation, Phone } from "lucide-react";
import type { PublicBranch } from "@/lib/public-branch-types";
import { branchDirectionsUrl } from "@/lib/public-branch-utils";
import { whatsappLink } from "@/lib/utils";

export function BranchCard({ branch }: { branch: PublicBranch }) {
  const directions = branchDirectionsUrl(branch);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-sky-50 to-teal-50">
        {branch.image ? (
          <Image
            src={branch.image}
            alt={branch.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">📍</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
          {branch.city}
          {branch.state ? `, ${branch.state}` : ""}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-bold text-slate-900">{branch.name}</h3>
        <p className="mt-2 flex gap-2 text-sm text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
          {branch.fullAddress}
        </p>
        <p className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Clock className="h-3.5 w-3.5 text-sky-500" />
          {branch.openingHoursSummary}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          <Phone className="mr-1 inline h-3.5 w-3.5 text-sky-500" />
          {branch.phone}
        </p>

        {(branch.doctors.length > 0 || branch.services.length > 0) && (
          <div className="mt-4 space-y-2 text-xs text-slate-500">
            {branch.doctors.length > 0 && (
              <p>
                <span className="font-semibold text-slate-700">Doctors: </span>
                {branch.doctors.map((d) => d.name).join(", ")}
              </p>
            )}
            {branch.services.length > 0 && (
              <p className="line-clamp-2">
                <span className="font-semibold text-slate-700">Services: </span>
                {branch.services.map((s) => s.name).join(", ")}
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <Link
            href={`/branches/${branch.slug}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-sky-50"
          >
            View Location
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/appointment?branch=${encodeURIComponent(branch.slug)}`}
              className="btn-primary inline-flex items-center justify-center gap-1 py-2.5 text-xs sm:text-sm"
            >
              <Calendar className="h-4 w-4" />
              Book
            </Link>
            <a
              href={directions}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center justify-center gap-1 py-2.5 text-xs sm:text-sm"
            >
              <Navigation className="h-4 w-4" />
              Directions
            </a>
          </div>
          <a
            href={whatsappLink(branch.whatsapp, `Hi, I want to visit ${branch.name}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-sm font-semibold text-teal-700 hover:underline"
          >
            WhatsApp this branch
          </a>
        </div>
      </div>
    </article>
  );
}
