import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { GoogleTagManagerBody, GoogleTagManagerHead } from "@/components/analytics/google-tag-manager";
import { getSiteUrl, DEFAULT_SEO_KEYWORDS } from "@/lib/seo/site-url";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const clinicName = "Shiv Dental Clinic";
const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${clinicName} | Premium Dental Care`, template: `%s | ${clinicName}` },
  description:
    "Shiv Dental Clinic — expert dentists for implants, root canal, teeth whitening, braces & painless care. Book your appointment online or call today.",
  keywords: DEFAULT_SEO_KEYWORDS,
  applicationName: clinicName,
  openGraph: {
    title: `${clinicName} | Premium Dental Care`,
    description: "Professional, compassionate dental care for your whole family.",
    type: "website",
    locale: "en_IN",
    siteName: clinicName,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${clinicName} | Premium Dental Care`,
    description: "Book dental appointments online — implants, RCT, cosmetic dentistry & more.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  verification: {
    google: "ox-Bdbyr7tMjtZQnvEmaCTmYvDhg6xhYMV6uIX0ZpBQ",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <head>
        <GoogleTagManagerHead />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <GoogleTagManagerBody />
        {children}
      </body>
    </html>
  );
}
