import type { Metadata } from "next";
import { getPublicDoctors } from "@/lib/public-data";
import { DoctorCard } from "@/components/public/doctor-card";

export const metadata: Metadata = {
  title: "Our Doctors",
  description:
    "Meet experienced dental professionals dedicated to comfortable, personalized and quality care at Shiv Dental Clinic.",
};

export default async function DoctorsPage() {
  const doctors = await getPublicDoctors();

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white pb-20 pt-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Meet Our Dental Experts
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Experienced professionals dedicated to providing comfortable, personalized and quality dental care.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>

        {doctors.length === 0 && (
          <p className="mt-12 text-center text-slate-500">Doctor profiles will appear here soon.</p>
        )}
      </div>
    </div>
  );
}
