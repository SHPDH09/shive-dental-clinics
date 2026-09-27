import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

type FooterProps = {
  clinicName: string;
  phone: string;
  email: string;
  address: string;
  footerText?: string | null;
  socialLinks?: Record<string, string> | null;
};

export function PublicFooter({
  clinicName,
  phone,
  email,
  address,
  footerText,
  socialLinks,
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
              <Link href="/appointment" className="hover:text-white">Book appointment</Link>
            </li>
            <li>
              <Link href="/#services" className="hover:text-white">Services</Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">Contact</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-white">Contact</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
              <span>{address}</span>
            </li>
            <li className="flex gap-2">
              <Phone className="h-4 w-4 shrink-0 text-sky-400" />
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-white">{phone}</a>
            </li>
            <li className="flex gap-2">
              <Mail className="h-4 w-4 shrink-0 text-sky-400" />
              <a href={`mailto:${email}`} className="hover:text-white">{email}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        {footerText ?? `© ${year} ${clinicName}. All rights reserved.`}
      </div>
    </footer>
  );
}
