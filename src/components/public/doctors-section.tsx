import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublicDoctor } from "@/lib/public-doctor-types";
import { DoctorCard } from "@/components/public/doctor-card";

export function DoctorsSection({ doctors }: { doctors: PublicDoctor[] }) {
  if (doctors.length === 0) return null;

  return (
    <section id="doctors" className="scroll-mt-24 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="section-title">Meet Your Dental Care Team</h2>
            <p className="section-subtitle">
              Skilled professionals focused on your comfort, confidence and healthy smile.
            </p>
          </div>
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] transition-all hover:gap-3"
          >
            Meet All Doctors
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doc) => (
            <DoctorCard key={doc.id} doctor={doc} />
          ))}
        </div>
      </div>
    </section>
  );
}
