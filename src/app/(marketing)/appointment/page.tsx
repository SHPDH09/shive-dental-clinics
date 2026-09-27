import type { Metadata } from "next";
import { AppointmentForm } from "@/components/public/appointment-form";
import { getPublicServices } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Book Appointment",
  description: "Schedule your dental appointment at Shiv Dental Clinic.",
};

export default async function AppointmentPage() {
  const services = await getPublicServices();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Book an appointment</h1>
      <p className="mt-2 text-slate-600">
        Choose your preferred date and treatment. Our team will call you to confirm.
      </p>
      <div className="mt-10">
        <AppointmentForm services={services.map((s) => ({ id: s.id, name: s.name }))} />
      </div>
    </div>
  );
}
