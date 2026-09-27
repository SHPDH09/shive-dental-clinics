import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublicBranch } from "@/lib/public-branch-types";
import { BranchCard } from "@/components/public/branch-card";

export function BranchesSection({ branches }: { branches: PublicBranch[] }) {
  const featured = branches.filter((b) => b.featured);
  const display = (featured.length > 0 ? featured : branches).slice(0, 3);
  if (display.length === 0) return null;

  return (
    <section id="locations" className="scroll-mt-24 bg-gradient-to-b from-slate-50 to-white py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="section-title">Our Clinic Locations</h2>
            <p className="section-subtitle">
              Visit Shiv Dental Clinic at a location convenient for you.
            </p>
          </div>
          <Link
            href="/branches"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] transition-all hover:gap-3"
          >
            Find a clinic near you
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {display.map((branch) => (
            <BranchCard key={branch.id} branch={branch} />
          ))}
        </div>
      </div>
    </section>
  );
}
