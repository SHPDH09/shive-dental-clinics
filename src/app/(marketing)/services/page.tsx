import type { Metadata } from "next";
import { getPublicServices } from "@/lib/public-data";
import { ServiceCard } from "@/components/public/service-card";

export const metadata: Metadata = {
  title: "Dental Services",
  description:
    "From routine checkups to advanced dental treatments, Shiv Dental Clinic provides comfortable and personalized care for every smile.",
};

export default async function ServicesPage() {
  const services = await getPublicServices();

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white pb-20 pt-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Complete Dental Care Under One Roof
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            From routine checkups to advanced dental treatments, Shiv Dental Clinic provides comfortable and
            personalized care for every smile.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {services.length === 0 && (
          <p className="mt-12 text-center text-slate-500">Our service list is being updated. Please call the clinic to book.</p>
        )}
      </div>
    </div>
  );
}
