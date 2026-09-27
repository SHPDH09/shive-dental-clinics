type JsonLdProps = {
  clinicName: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  url: string;
};

export function DentalClinicJsonLd({
  clinicName,
  description,
  phone,
  email,
  address,
  url,
}: JsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Dentist",
    name: clinicName,
    description,
    url,
    telephone: phone,
    email,
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressCountry: "IN",
    },
    medicalSpecialty: "Dentistry",
    priceRange: "$$",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
