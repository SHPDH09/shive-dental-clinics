import Link from "next/link";
import { getCachedPublicSiteStatus } from "@/lib/cached-public";

export const revalidate = 60;

export default async function MaintenancePage() {
  const status = await getCachedPublicSiteStatus();
  const message =
    status.message?.trim() ||
    "We'll be back shortly. Shiv Dental Clinic is currently undergoing scheduled maintenance.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-6 text-center text-white">
      <h1 className="text-2xl font-bold md:text-3xl">We&apos;ll be back soon</h1>
      <p className="mt-4 max-w-md text-slate-300">{message}</p>
      <p className="mt-8 text-sm text-slate-500">
        Urgent care? Call{" "}
        <a href="tel:+919973479904" className="font-semibold text-[#f4c430] hover:underline">
          +91 9973479904
        </a>
      </p>
      {!status.maintenance ? (
        <Link href="/" className="mt-6 text-sm text-sky-300 hover:underline">
          Return to homepage
        </Link>
      ) : null}
    </div>
  );
}
