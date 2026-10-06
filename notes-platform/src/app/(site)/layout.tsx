import { PublicNavbar } from "@/components/layout/public-navbar";
import { brand } from "@/config/brand";
import Link from "next/link";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      <main>{children}</main>
      <footer className="border-t border-slate-200/80 bg-white/70 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 md:flex-row md:items-center md:justify-between lg:px-6">
          <div>
            <p className="font-semibold text-slate-900">{brand.name}</p>
            <p className="text-sm text-slate-600">{brand.tagline}</p>
          </div>
          <div className="flex gap-4 text-sm text-slate-600">
            <Link href="/notes">Notes</Link>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
