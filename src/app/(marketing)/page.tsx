import { HeroSection } from "@/components/public/hero";
import { ServicesSection } from "@/components/public/services-section";
import { AboutSection } from "@/components/public/about-section";
import { DoctorsSection } from "@/components/public/doctors-section";
import { TestimonialsSection } from "@/components/public/testimonials-section";
import { GallerySection } from "@/components/public/gallery-section";
import { BeforeAfterSection } from "@/components/public/before-after-section";
import { ContactSection } from "@/components/public/contact-section";
import { AppointmentForm } from "@/components/public/appointment-form";
import { getClinicSettings, getHeroStats } from "@/lib/settings";
import {
  getPublicBeforeAfter,
  getPublicDoctors,
  getPublicGallery,
  getPublicServices,
  getPublicTestimonials,
} from "@/lib/public-data";

export default async function HomePage() {
  const [settings, stats, services, doctors, testimonials, gallery, beforeAfter] = await Promise.all([
    getClinicSettings(),
    getHeroStats(),
    getPublicServices(),
    getPublicDoctors(),
    getPublicTestimonials(),
    getPublicGallery(),
    getPublicBeforeAfter(),
  ]);

  const openingHours = settings.openingHours as { weekdays?: string; sunday?: string } | null;

  return (
    <>
      <HeroSection clinicName={settings.clinicName} stats={stats} />
      <ServicesSection services={services} />
      <AboutSection
        aboutIntro={settings.aboutIntro}
        mission={settings.mission}
        vision={settings.vision}
        whyChooseUs={settings.whyChooseUs}
      />
      <DoctorsSection doctors={doctors} />
      <section className="bg-gradient-to-br from-teal-50 to-sky-50 py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <div className="mb-8 text-center">
            <h2 className="section-title">Ready for your visit?</h2>
            <p className="section-subtitle mx-auto">Fill in your details and we will confirm your appointment.</p>
          </div>
          <AppointmentForm
            services={services.map((s) => ({ id: s.id, name: s.name }))}
          />
        </div>
      </section>
      <TestimonialsSection testimonials={testimonials} />
      <GallerySection items={gallery} />
      <BeforeAfterSection cases={beforeAfter} />
      <ContactSection
        phone={settings.phone}
        email={settings.email}
        address={settings.address}
        mapEmbedUrl={settings.mapEmbedUrl}
        openingHours={openingHours}
      />
    </>
  );
}
