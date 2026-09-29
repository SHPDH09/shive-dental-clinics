/** Cache layout data briefly to reduce Worker CPU on every page view (Cloudflare 1102). */
export const revalidate = 120;

import { Suspense } from "react";
import { PublicFooter } from "@/components/public/footer";
import { VisitTracker } from "@/components/public/visit-tracker";
import { LeadCaptureSuite } from "@/components/public/lead-capture-suite";
import { PublicHeader } from "@/components/public/header";
import { MobileStickyActions } from "@/components/public/mobile-sticky-actions";
import { DentalClinicJsonLd } from "@/components/public/json-ld";
import { CLINIC_STOREFRONT_BG } from "@/lib/branding";
import { getPublicBranches } from "@/lib/public-data";
import { getSiteUrl } from "@/lib/seo/site-url";
import { getClinicSettings } from "@/lib/settings";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [settings, branches] = await Promise.all([getClinicSettings(), getPublicBranches()]);
  const social = (settings.socialLinks ?? {}) as Record<string, string>;
  const siteUrl = getSiteUrl();

  return (
    <>
      <DentalClinicJsonLd
        clinicName={settings.clinicName}
        description={settings.seoDescription ?? "Premium dental care at Shiv Dental Clinic."}
        phone={settings.phone}
        email={settings.email}
        address={settings.address}
        url={siteUrl}
        logoUrl={settings.logoUrl}
      />
      <PublicHeader
        clinicName={settings.clinicName}
        phone={settings.phone}
        logoUrl={settings.logoUrl}
        backgroundImageUrl={CLINIC_STOREFRONT_BG}
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
      <Suspense fallback={null}>
        <VisitTracker />
        <LeadCaptureSuite />
      </Suspense>
    </>
  );
}
