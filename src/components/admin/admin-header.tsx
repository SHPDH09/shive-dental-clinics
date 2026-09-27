"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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

  return (
    <header className="relative flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        {sidebarHidden && onShowSidebar && (
          <button
            type="button"
            className="hidden rounded-lg p-2 hover:bg-slate-50 lg:inline-flex"
            aria-label="Show menu"
            onClick={onShowSidebar}
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          className="rounded-lg p-2 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <p className="text-sm text-slate-500">
          Welcome, <span className="font-semibold text-slate-800">{session?.user?.name ?? "Admin"}</span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        {isSuper && (
          <Link href="/admin/super" className="hidden text-sm text-slate-600 hover:text-slate-900 sm:inline">
            Super admin
          </Link>
        )}
        <Link href="/admin/profile" className="text-sm text-slate-600 hover:text-slate-900">
          Profile
        </Link>
        <Link href="/" className="text-sm text-[var(--primary)] hover:underline">
          View site
        </Link>
        <Button type="button" variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-16 z-40 max-h-[70vh] overflow-y-auto border-b border-slate-200 bg-white p-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {mobileLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm"
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
