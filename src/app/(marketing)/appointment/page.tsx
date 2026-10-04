import type { Metadata } from "next";
import { AppointmentBookingWizard } from "@/components/public/appointment-booking-wizard";
import { AppointmentForm } from "@/components/public/appointment-form";
import { VoiceBookingTrigger } from "@/components/public/voice-booking-trigger";
import { getPublicDoctors, getPublicServicePickerOptions } from "@/lib/public-data";
import { getCachedPublicBranches } from "@/lib/cached-public";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Book Appointment",
  description: "Schedule your dental appointment at Shiv Dental Clinic.",
};

type PageProps = {
  searchParams: Promise<{ service?: string; doctor?: string; branch?: string }>;
};

export default async function AppointmentPage({ searchParams }: PageProps) {
  const { service: serviceSlug, doctor: doctorSlug, branch: branchSlug } = await searchParams;
  const [serviceOptions, doctors, branches] = await Promise.all([
    getPublicServicePickerOptions(),
    getPublicDoctors(),
    getCachedPublicBranches(),
  ]);

  const useWizard = branches.length > 0 && doctors.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Book an appointment</h1>
      <p className="mt-2 text-slate-600">
        {useWizard
          ? "Choose your branch, doctor, treatment, and a time that works for you."
          : "Choose your preferred date and treatment. Our team will call you to confirm."}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <VoiceBookingTrigger
          services={serviceOptions.map((s) => ({ id: s.id, name: s.name }))}
          variant="primary"
          label="Book with voice assistant"
        />
        <span className="text-xs text-slate-500">Uses your microphone · Hindi or English</span>
      </div>
      <div className="mt-10">
        {useWizard ? (
          <AppointmentBookingWizard
            branches={branches.map((b) => ({
              id: b.id,
              name: b.name,
              slug: b.slug,
              city: b.city,
              doctorIds: b.doctorIds,
              serviceIds: b.serviceIds,
            }))}
            doctors={doctors.map((d) => ({
              id: d.id,
              name: d.name,
              slug: d.slug,
              specialization: d.specialization,
            }))}
            services={serviceOptions}
            initialBranchSlug={branchSlug ?? null}
            initialDoctorSlug={doctorSlug ?? null}
            initialServiceSlug={serviceSlug ?? null}
          />
        ) : (
          <AppointmentForm
            services={serviceOptions}
            initialServiceSlug={serviceSlug ?? null}
          />
        )}
      </div>
    </div>
  );
}
