import { Stethoscope } from "lucide-react";

type Doctor = {
  id: string;
  name: string;
  qualification: string;
  specialization: string;
  experienceYears: number;
  bio: string;
  summary?: string | null;
  registrationNumber?: string | null;
  phone?: string | null;
  consultationHours: string | null;
  image: string | null;
  featured?: boolean;
};

export function DoctorsSection({ doctors }: { doctors: Doctor[] }) {
  if (doctors.length === 0) return null;

  return (
    <section id="doctors" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="section-title">Meet our dentists</h2>
        <p className="section-subtitle">Skilled professionals dedicated to gentle, precise care.</p>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doc) => (
            <article key={doc.id} className="card-premium overflow-hidden">
              <div className="flex h-48 items-center justify-center bg-gradient-to-br from-sky-100 to-teal-50">
                {doc.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={doc.image} alt={doc.name} className="h-full w-full object-cover" />
                ) : (
                  <Stethoscope className="h-16 w-16 text-sky-300" />
                )}
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900">{doc.name}</h3>
                <p className="text-sm font-medium text-[var(--primary)]">{doc.specialization}</p>
                <p className="mt-1 text-xs text-slate-500">{doc.qualification}</p>
                <p className="mt-3 text-sm text-slate-600 line-clamp-3">{doc.summary?.trim() || doc.bio}</p>
                {doc.registrationNumber && (
                  <p className="mt-2 text-xs text-slate-500">Reg. {doc.registrationNumber}</p>
                )}
                <p className="mt-4 text-xs text-slate-500">
                  {doc.experienceYears}+ years · {doc.consultationHours ?? "By appointment"}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
