import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

export type FooterBranch = {
  id: string;
  name: string;
  location: string;
  phone: string | null;
  openTime: string;
  closeTime: string;
  offDays: string | null;
  status: "ACTIVE" | "CLOSED";
};

type FooterProps = {
  clinicName: string;
  phone: string;
  email: string;
  address: string;
  footerText?: string | null;
  socialLinks?: Record<string, string> | null;
  branches?: FooterBranch[];
};

export function PublicFooter({
  clinicName,
  phone,
  email,
  address,
  footerText,
  socialLinks,
  branches = [],
}: FooterProps) {
  const year = new Date().getFullYear();
  const social = (socialLinks ?? {}) as Record<string, string>;

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="text-xl font-bold text-white">{clinicName}</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
            Compassionate, modern dental care for your whole family. Your smile is our priority.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {Object.entries(social).map(([key, url]) =>
              url ? (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs capitalize text-slate-300 hover:border-sky-500 hover:text-white"
                >
                  {key}
                </a>
              ) : null,
            )}
          </div>
        </div>

        <div>
          <p className="font-semibold text-white">Quick links</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/appointment" className="hover:text-white">
                Book appointment
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-white">
                Services
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-white">Head office</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
              <span>{address}</span>
            </li>
            <li className="flex gap-2">
              <Phone className="h-4 w-4 shrink-0 text-sky-400" />
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-white">
                {phone}
              </a>
            </li>
            <li className="flex gap-2">
              <Mail className="h-4 w-4 shrink-0 text-sky-400" />
              <a href={`mailto:${email}`} className="hover:text-white">
                {email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {branches.length > 0 && (
        <div className="border-t border-slate-800 bg-slate-950/50">
          <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
            <p className="text-center text-sm font-semibold uppercase tracking-wide text-sky-400">
              Our branches
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => (
                <article
                  key={branch.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white">{branch.name}</h3>
                    <span
                      className={
                        branch.status === "ACTIVE"
                          ? "shrink-0 rounded-full bg-teal-900/80 px-2 py-0.5 text-xs font-medium text-teal-300"
                          : "shrink-0 rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-300"
                      }
                    >
                      {branch.status === "ACTIVE" ? "Open" : "Closed"}
                    </span>
                  </div>
                  <p className="mt-3 flex gap-2 text-slate-400">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                    {branch.location}
                  </p>
                  <p className="mt-2 flex gap-2 text-slate-400">
                    <Clock className="h-4 w-4 shrink-0 text-sky-500" />
                    {branch.openTime} – {branch.closeTime}
                    {branch.offDays ? ` · Off: ${branch.offDays}` : ""}
                  </p>
                  {branch.phone && (
                    <p className="mt-2 flex gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-sky-500" />
                      <a href={`tel:${branch.phone.replace(/\s/g, "")}`} className="hover:text-white">
                        {branch.phone}
                      </a>
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        {footerText ?? `© ${year} ${clinicName}. All rights reserved.`}
      </div>
    </footer>
  );
}
