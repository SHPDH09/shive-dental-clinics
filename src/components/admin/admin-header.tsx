"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, PanelLeftOpen, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { AdminServiceSearch } from "@/components/admin/admin-service-search";

const mobileLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/appointments", label: "Appointments" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
];

type Props = {
  sidebarHidden?: boolean;
  onShowSidebar?: () => void;
};

export function AdminHeader({ sidebarHidden, onShowSidebar }: Props) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const isSuper = session?.user?.role === "SUPER_ADMIN";
  const today = format(new Date(), "EEE, d MMM yyyy");

  return (
    <header className="relative z-30 shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="flex min-h-[4rem] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {sidebarHidden && onShowSidebar && (
          <button
            type="button"
            className="hidden rounded-xl border border-slate-200 p-2 hover:bg-slate-50 lg:inline-flex"
            aria-label="Show menu"
            onClick={onShowSidebar}
          >
            <PanelLeftOpen className="h-5 w-5 text-slate-600" />
          </button>
        )}
        <button
          type="button"
          className="rounded-xl p-2 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs font-medium text-slate-500">{today}</p>
          <p className="text-sm text-slate-700">
            Welcome,{" "}
            <span className="font-semibold text-slate-900">{session?.user?.name ?? "Admin"}</span>
          </p>
        </div>
      </div>
      <div className="hidden min-w-0 flex-1 justify-center px-2 lg:flex">
        <AdminServiceSearch className="max-w-lg" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isSuper && (
          <span className="hidden rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 sm:inline">
            Super admin
          </span>
        )}
        <Link
          href="/admin/profile"
          className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          Profile
        </Link>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--primary)] transition hover:bg-sky-50"
        >
          View site
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full border border-slate-200"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
      </div>
      <div className="border-t border-slate-100 px-4 pb-3 lg:hidden">
        <AdminServiceSearch />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-40 max-h-[70vh] overflow-y-auto border-b border-slate-200 bg-white p-4 shadow-lg lg:hidden">
          <nav className="flex flex-col gap-1">
            {mobileLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            {isSuper && (
              <Link href="/admin/super" className="rounded-lg px-3 py-2 text-sm" onClick={() => setOpen(false)}>
                Super admin panel
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
