import { getPublicSiteStatus } from "@/lib/clinic-settings/service";

export default async function MaintenancePage() {
  let message =
    "We'll be back shortly. Shiv Dental Clinic is currently undergoing scheduled maintenance.";
  try {
    const status = await getPublicSiteStatus();
    if (status.message) message = status.message;
  } catch {
    /* use default */
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Maintenance</p>
      <h1 className="mt-4 max-w-lg text-3xl font-bold text-slate-900">We&apos;ll be back shortly</h1>
      <p className="mt-4 max-w-md text-slate-600">{message}</p>
      <a href="/admin/login" className="mt-8 text-sm text-sky-600 hover:underline">
        Admin login
      </a>
    </div>
  );
}
