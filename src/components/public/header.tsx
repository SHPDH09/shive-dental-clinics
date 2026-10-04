"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ClinicNameAlternate } from "@/components/public/clinic-name-alternate";
import { CLINIC_LOGO_URL, PUBLIC_HEADER_BG } from "@/lib/branding";
import Image from "next/image";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/#about", label: "About" },
  { href: "/doctors", label: "Doctors" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/branches", label: "Locations" },
  { href: "/contact", label: "Contact" },
];

type HeaderProps = {
  clinicName: string;
  phone: string;
  logoUrl?: string | null;
  backgroundImageUrl?: string | null;
};

export function PublicHeader({ clinicName, phone, logoUrl }: HeaderProps) {
  const logo = logoUrl?.trim() || CLINIC_LOGO_URL;
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      className="relative sticky top-0 z-50 border-b border-white/10 shadow-md"
      style={{ backgroundColor: PUBLIC_HEADER_BG }}
    >
      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3 font-bold text-white">
          <Image
            src={logo}
            alt={`${clinicName} logo`}
            width={48}
            height={48}
            className="h-11 w-11 shrink-0 rounded-lg object-contain ring-1 ring-white/25"
            priority
          />
          <ClinicNameAlternate englishName={clinicName} className="text-white" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={isHome ? item.href : item.href.replace("/#", "/#")}
              className="rounded-full px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/15 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="flex items-center gap-2 text-sm font-semibold text-white"
          >
            <Phone className="h-4 w-4 text-white/90" />
            {phone}
          </a>
          <Link
            href="/appointment"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0a192f] transition hover:bg-sky-50"
          >
            Book Appointment
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={cn(
          "relative z-10 border-t border-white/10 px-4 py-4 lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/95 hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/appointment"
            className="mt-2 inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#0a192f]"
            onClick={() => setOpen(false)}
          >
            Book Appointment
          </Link>
        </nav>
      </div>
    </header>
  );
}
