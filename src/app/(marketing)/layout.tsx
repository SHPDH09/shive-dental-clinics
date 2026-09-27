export const dynamic = "force-dynamic";

import { PublicFooter } from "@/components/public/footer";
import { PublicHeader } from "@/components/public/header";
import { MobileStickyActions } from "@/components/public/mobile-sticky-actions";
import { DentalClinicJsonLd } from "@/components/public/json-ld";
import { getPublicHeroSlides } from "@/lib/hero-slides";
import { getPublicBranches } from "@/lib/public-data";
import { getClinicSettings } from "@/lib/settings";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [settings, branches, heroSlides] = await Promise.all([
    getClinicSettings(),
    getPublicBranches(),
    getPublicHeroSlides(),
  ]);
  const headerBackgroundUrl = heroSlides[0]?.imageUrl ?? "/branding/clinic-header-bg.png";
  const social = (settings.socialLinks ?? {}) as Record<string, string>;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shivdentalclinic.com";

  return (
    <>
      <DentalClinicJsonLd
        clinicName={settings.clinicName}
        description={settings.seoDescription ?? "Premium dental care at Shiv Dental Clinic."}
        phone={settings.phone}
        email={settings.email}
        address={settings.address}
        url={appUrl}
      />
      <PublicHeader
        clinicName={settings.clinicName}
        phone={settings.phone}
        logoUrl={settings.logoUrl}
        backgroundImageUrl={headerBackgroundUrl}
      />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <PublicFooter
        clinicName={settings.clinicName}
        phone={settings.phone}
        email={settings.email}
        address={settings.address}
        footerText={settings.footerText}
        socialLinks={social}
        branches={branches}
      />
      <MobileStickyActions phone={settings.phone} whatsapp={settings.whatsapp} />
    </>
  );
}
