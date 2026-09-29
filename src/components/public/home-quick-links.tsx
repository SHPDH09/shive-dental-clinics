import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Images,
  Sparkles,
  Stethoscope,
  Star,
  UserRound,
  Video,
} from "lucide-react";

const links = [
  {
    href: "/services",
    title: "Dental services",
    desc: "Implants, RCT, whitening & more",
    icon: Stethoscope,
  },
  {
    href: "/doctors",
    title: "Our doctors",
    desc: "Meet experienced specialists",
    icon: UserRound,
  },
  {
    href: "/transformations",
    title: "Before & after",
    desc: "Real smile transformations",
    icon: Sparkles,
  },
  {
    href: "/testimonials",
    title: "Patient reviews",
    desc: "Stories from happy patients",
    icon: Star,
  },
  {
    href: "/gallery",
    title: "Clinic gallery",
    desc: "Modern equipment & ambience",
    icon: Images,
  },
  {
    href: "/videos",
    title: "Watch & learn",
    desc: "Treatment tips & demos",
    icon: Video,
  },
  {
    href: "/branches",
    title: "Branches",
    desc: "Find a clinic near you",
    icon: Building2,
  },
  {
    href: "/contact",
    title: "Contact us",
    desc: "Map, hours & enquiries",
    icon: ArrowRight,
  },
];

export function HomeQuickLinks() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="text-center">
          <h2 className="section-title">Explore our clinic online</h2>
          <p className="section-subtitle mx-auto">
            Everything you need — treatments, team, results, and locations — in one premium dental experience.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {links.map(({ href, title, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-md hover:ring-[var(--primary)]/25"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-white">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-600">{desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)]">
                View
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
