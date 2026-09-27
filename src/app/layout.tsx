import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getClinicSettings } from "@/lib/settings";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getClinicSettings();
  const title = settings.seoTitle ?? `${settings.clinicName} | Premium Dental Care`;
  const description =
    settings.seoDescription ??
    "Professional, compassionate dental care. Book your appointment at Shiv Dental Clinic today.";

  return {
    title: { default: title, template: `%s | ${settings.clinicName}` },
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_IN",
      siteName: settings.clinicName,
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
