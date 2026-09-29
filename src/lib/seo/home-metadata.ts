import type { Metadata } from "next";
import { getSiteUrl, DEFAULT_SEO_KEYWORDS } from "@/lib/seo/site-url";
import { CLINIC_LOGO_URL } from "@/lib/branding";

type HomeSeoInput = {
  clinicName: string;
  tagline?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  phone?: string | null;
  address?: string | null;
};

export function buildHomeMetadata(input: HomeSeoInput): Metadata {
  const siteUrl = getSiteUrl();
  const title =
    input.seoTitle?.trim() ||
    `${input.clinicName} | Best Dentist & Dental Care — Book Appointment Online`;
  const description =
    input.seoDescription?.trim() ||
    `${input.clinicName} offers expert dental care — implants, root canal, teeth whitening, braces & painless treatments. ${input.tagline ?? "Healthy teeth, confident smiles."} Call ${input.phone ?? ""} or book online today.`.replace(
      /\s+/g,
      " ",
    );

  const ogImage = `${siteUrl}${CLINIC_LOGO_URL}`;

  return {
    title,
    description,
    keywords: DEFAULT_SEO_KEYWORDS,
    authors: [{ name: input.clinicName }],
    creator: input.clinicName,
    publisher: input.clinicName,
    category: "health",
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: input.clinicName,
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 512,
          height: 512,
          alt: `${input.clinicName} logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      "geo.region": "IN",
      ...(input.address ? { "geo.placename": input.address.slice(0, 120) } : {}),
    },
  };
}
