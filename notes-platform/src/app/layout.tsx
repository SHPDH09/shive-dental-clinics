import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AppSessionProvider } from "@/components/providers/session-provider";
import { brand } from "@/config/brand";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${brand.name} | Premium Notes Marketplace`,
  description: brand.shortDescription,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <AppSessionProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AppSessionProvider>
      </body>
    </html>
  );
}
