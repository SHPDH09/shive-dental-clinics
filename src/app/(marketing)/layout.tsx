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
import { getSiteUrl } from "@/lib/seo/site-url";
import { getCachedClinicSettings, getCachedPublicBranches, getCachedPublicSiteStatus } from "@/lib/cached-public";
import { redirect } from "next/navigation";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const status = await getCachedPublicSiteStatus();
  if (status.maintenance) {
    redirect("/maintenance");
  }

  const [settings, branches] = await Promise.all([getCachedClinicSettings(), getCachedPublicBranches()]);
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
