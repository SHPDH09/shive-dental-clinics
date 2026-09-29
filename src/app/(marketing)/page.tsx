import type { Metadata } from "next";
import { HeroSection } from "@/components/public/hero";
import { ServicesSection } from "@/components/public/services-section";
import { AboutSection } from "@/components/public/about-section";
import { DoctorsSection } from "@/components/public/doctors-section";
import { FeaturedDoctorSection } from "@/components/public/featured-doctor-section";
import { TestimonialsSection } from "@/components/public/testimonials-section";
import { GallerySection } from "@/components/public/gallery-section";
import { WatchLearnSection } from "@/components/public/watch-learn-section";
import { BeforeAfterSection } from "@/components/public/before-after-section";
import { BranchesSection } from "@/components/public/branches-section";
import { ContactSection } from "@/components/public/contact-section";
import { AppointmentForm } from "@/components/public/appointment-form";
import { HomeTrustStrip } from "@/components/public/home-trust-strip";
import { HomeQuickLinks } from "@/components/public/home-quick-links";
import { HomeCtaBand } from "@/components/public/home-cta-band";
import { HomeFaqSection, DEFAULT_HOME_FAQS, faqJsonLd } from "@/components/public/home-faq-section";
import { JsonLdScript } from "@/components/public/json-ld";
import { CLINIC_STOREFRONT_BG } from "@/lib/branding";
import { buildHomeMetadata } from "@/lib/seo/home-metadata";
import { getPublicHeroSlides } from "@/lib/hero-slides";
import { getClinicSettings, getHeroStats } from "@/lib/settings";
import {
  getPublicBeforeAfter,
  getPublicBranches,
  getFeaturedDoctor,
  getFeaturedPublicDoctors,
  getPublicGallery,
  getPublicServices,
  getPublicTestimonials,
  getPublicVideos,
} from "@/lib/public-data";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getClinicSettings();
  return buildHomeMetadata({
    clinicName: settings.clinicName,
    tagline: settings.tagline,
    seoTitle: settings.seoTitle,
    seoDescription: settings.seoDescription,
    phone: settings.phone,
    address: settings.address,
  });
}

export default async function HomePage() {
  const [settings, stats, heroSlides, services, branches, featuredDoctor, teamDoctors, testimonials, gallery, videos, featuredCases, allCases] =
    await Promise.all([
      getClinicSettings(),
      getHeroStats(),
      getPublicHeroSlides(),
      getPublicServices(),
      getPublicBranches(),
      getFeaturedDoctor(),
      getFeaturedPublicDoctors(6),
      getPublicTestimonials(),
      getPublicGallery(),
      getPublicVideos(6),
      getPublicBeforeAfter(6, { featuredOnly: true }),
      getPublicBeforeAfter(6, { featuredOnly: false }),
    ]);

  const beforeAfter = featuredCases.length >= 3 ? featuredCases : allCases.slice(0, 6);

  const openingHours = settings.openingHours as { weekdays?: string; sunday?: string } | null;

  return (
    <>
      <JsonLdScript data={faqJsonLd(DEFAULT_HOME_FAQS)} />
      <HeroSection
        clinicName={settings.clinicName}
        stats={stats}
        slides={heroSlides}
        backgroundImageUrl={CLINIC_STOREFRONT_BG}
      />
      <HomeTrustStrip />
      <section id="book" className="-mt-2 pb-10 md:pb-12">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <div className="card-premium p-6 md:p-8">
            <div className="mb-6 text-center md:text-left">
              <h2 className="text-2xl font-bold text-slate-900">Book an appointment in under a minute</h2>
              <p className="mt-2 text-slate-600">
                Tell us your preferred time — we will confirm shortly. Same-week slots often available.
              </p>
            </div>
            <AppointmentForm
              services={services.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))}
              compact
            />
          </div>
        </div>
      </section>
      <HomeQuickLinks />
      <ServicesSection services={services} />
      <AboutSection
        aboutIntro={settings.aboutIntro}
        mission={settings.mission}
        vision={settings.vision}
        whyChooseUs={settings.whyChooseUs}
      />
      <HomeCtaBand phone={settings.phone} whatsapp={settings.whatsapp} />
      <FeaturedDoctorSection doctor={featuredDoctor} />
      <DoctorsSection doctors={teamDoctors} />
      <TestimonialsSection testimonials={testimonials} />
      <GallerySection items={gallery} />
      <WatchLearnSection videos={videos} />
      <BeforeAfterSection cases={beforeAfter} />
      <BranchesSection branches={branches} />
      <HomeFaqSection clinicName={settings.clinicName} />
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
