import type { Metadata } from "next";
import { getPublicBranches } from "@/lib/public-data";
import { BranchLocator } from "@/components/public/branch-locator";

export const metadata: Metadata = {
  title: "Clinic Locations",
  description: "Find Shiv Dental Clinic branches near you — addresses, hours, doctors, and booking.",
};

export default async function BranchesPage() {
  const branches = await getPublicBranches();

  return (
    <div className="pb-20 pt-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Our Clinic Locations
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Visit Shiv Dental Clinic at a location convenient for you.
          </p>
        </div>
        <div className="mt-12">
          <BranchLocator branches={branches} />
        </div>
      </div>
    </div>
  );
}
