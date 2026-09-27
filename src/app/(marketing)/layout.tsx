import { PublicFooter } from "@/components/public/footer";
import { PublicHeader } from "@/components/public/header";
import { MobileStickyActions } from "@/components/public/mobile-sticky-actions";
import { getClinicSettings } from "@/lib/settings";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const settings = await getClinicSettings();
  const social = (settings.socialLinks ?? {}) as Record<string, string>;

  return (
    <>
      <PublicHeader
        clinicName={settings.clinicName}
        phone={settings.phone}
        logoUrl={settings.logoUrl}
      />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <PublicFooter
        clinicName={settings.clinicName}
        phone={settings.phone}
        email={settings.email}
        address={settings.address}
        footerText={settings.footerText}
        socialLinks={social}
      />
      <MobileStickyActions phone={settings.phone} whatsapp={settings.whatsapp} />
    </>
  );
}
