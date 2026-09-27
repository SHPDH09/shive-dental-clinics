"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/#about", label: "About" },
  { href: "/doctors", label: "Doctors" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

type HeaderProps = {
  clinicName: string;
  phone: string;
  logoUrl?: string | null;
};

export function PublicHeader({ clinicName, phone, logoUrl }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-[var(--primary)]">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={clinicName} className="h-9 w-auto" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm">
              SD
            </span>
          )}
          <span className="text-lg tracking-tight text-slate-900">{clinicName}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={isHome ? item.href : item.href.replace("/#", "/#")}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-[var(--primary)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700"
          >
            <Phone className="h-4 w-4 text-[var(--cta)]" />
            {phone}
          </a>
          <Link href="/appointment" className="btn-primary text-sm">
            Book Appointment
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-slate-100 bg-white px-4 py-4 lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/appointment" className="btn-primary mt-2 text-center" onClick={() => setOpen(false)}>
            Book Appointment
          </Link>
        </nav>
      </div>
    </header>
  );
}
