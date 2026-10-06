"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { brand } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function PublicNavbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const isStudent = session?.user?.role === "STUDENT";

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 text-sm font-bold text-white shadow-lg">
            {brand.logoText}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{brand.name}</p>
            <p className="text-xs text-slate-500">Study smarter</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
            Home
          </Link>
          <Link href="/notes" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
            Notes
          </Link>
          {isStudent ? (
            <Link href="/dashboard">
              <Button size="sm">Student Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
                Login
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </nav>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/" onClick={() => setOpen(false)}>
              Home
            </Link>
            <Link href="/notes" onClick={() => setOpen(false)}>
              Notes
            </Link>
            {isStudent ? (
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                Student Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link href="/register" onClick={() => setOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
