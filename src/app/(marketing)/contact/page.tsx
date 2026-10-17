import type { Metadata } from "next";
import { ContactSection } from "@/components/public/contact-section";
import { normalizeMapEmbedUrl } from "@/lib/public-branch-utils";
import { getClinicSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Shiv Dental Clinic for appointments and enquiries.",
};

export default async function ContactPage() {
  const settings = await getClinicSettings();
  const openingHours = settings.openingHours as { weekdays?: string; sunday?: string } | null;

  return (
    <div className="pt-4">
      <ContactSection
        phone={settings.phone}
        email={settings.email}
        address={settings.address}
        mapEmbedUrl={normalizeMapEmbedUrl(settings.mapEmbedUrl)}
        openingHours={openingHours}
      />
    </div>
  );
}
