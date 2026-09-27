import type { Metadata } from "next";
import { AppointmentBookingWizard } from "@/components/public/appointment-booking-wizard";
import { AppointmentForm } from "@/components/public/appointment-form";
import { getPublicDoctors, getPublicServices } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Book Appointment",
  description: "Schedule your dental appointment at Shiv Dental Clinic.",
};

type PageProps = { searchParams: Promise<{ service?: string; doctor?: string }> };

export default async function AppointmentPage({ searchParams }: PageProps) {
  const { service: serviceSlug, doctor: doctorSlug } = await searchParams;
  const [services, doctors] = await Promise.all([getPublicServices(), getPublicDoctors()]);

  const useWizard = doctors.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Book an appointment</h1>
      <p className="mt-2 text-slate-600">
        {useWizard
          ? "Choose your doctor, treatment, and a time that works for you."
          : "Choose your preferred date and treatment. Our team will call you to confirm."}
      </p>
      <div className="mt-10">
        {useWizard ? (
          <AppointmentBookingWizard
            doctors={doctors.map((d) => ({
              id: d.id,
              name: d.name,
              slug: d.slug,
              specialization: d.specialization,
            }))}
            services={services.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))}
            initialDoctorSlug={doctorSlug ?? null}
            initialServiceSlug={serviceSlug ?? null}
          />
        ) : (
          <AppointmentForm
            services={services.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))}
            initialServiceSlug={serviceSlug ?? null}
          />
        )}
      </div>
    </div>
  );
}
