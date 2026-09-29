import { getSiteUrl } from "@/lib/seo/site-url";
import { CLINIC_LOGO_URL } from "@/lib/branding";

type JsonLdProps = {
  clinicName: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  url?: string;
  logoUrl?: string | null;
};

export function DentalClinicJsonLd({
  clinicName,
  description,
  phone,
  email,
  address,
  url,
  logoUrl,
}: JsonLdProps) {
  const siteUrl = url?.trim() || getSiteUrl();
  const logo = logoUrl?.trim() || `${siteUrl}${CLINIC_LOGO_URL}`;

  const dentist = {
    "@context": "https://schema.org",
    "@type": "Dentist",
    "@id": `${siteUrl}/#dentist`,
    name: clinicName,
    description,
    url: siteUrl,
    image: logo,
    logo,
    telephone: phone,
    email,
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressCountry: "IN",
    },
    medicalSpecialty: "Dentistry",
    priceRange: "$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "10:00",
        closes: "14:00",
      },
    ],
    sameAs: [] as string[],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: clinicName,
    url: siteUrl,
    description,
    publisher: { "@id": `${siteUrl}/#dentist` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/services?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const graph = [dentist, website];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}

export function JsonLdScript({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
