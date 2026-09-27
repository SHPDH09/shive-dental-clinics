"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
const mobileLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/appointments", label: "Appointments" },
  { href: "/admin/patients", label: "Patients" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminHeader() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
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
        <Link href="/admin/profile" className="text-sm text-slate-600 hover:text-slate-900">
          Profile
        </Link>
        <Link href="/" className="text-sm text-[var(--primary)] hover:underline">View site</Link>
        <Button type="button" variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-16 z-40 border-b border-slate-200 bg-white p-4 lg:hidden">
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
          </nav>
        </div>
      )}
    </header>
  );
}
