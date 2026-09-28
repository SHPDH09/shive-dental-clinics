import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const clinicName = "Shiv Dental Clinic";

export const metadata: Metadata = {
  title: { default: `${clinicName} | Premium Dental Care`, template: `%s | ${clinicName}` },
  description:
    "Professional, compassionate dental care. Book your appointment at Shiv Dental Clinic today.",
  openGraph: {
    title: `${clinicName} | Premium Dental Care`,
    description: "Professional, compassionate dental care for your whole family.",
    type: "website",
    locale: "en_IN",
    siteName: clinicName,
  },
  robots: { index: true, follow: true },
  verification: {
    google: "XThxVmKDx2q8dFHkMEcgcv7odBqKMz_DCJvye7EL_fM",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
