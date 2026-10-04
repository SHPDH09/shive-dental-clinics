"use client";

import Image from "next/image";
import { CLINIC_LOGO_URL } from "@/lib/branding";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export function AdminLoginScene() {
  return (
    <div className="admin-login-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="admin-login-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="admin-login-orb admin-login-orb-a pointer-events-none" aria-hidden />
      <div className="admin-login-orb admin-login-orb-b pointer-events-none" aria-hidden />
      <div className="admin-login-orb admin-login-orb-c pointer-events-none" aria-hidden />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <div className="admin-login-brand-enter mb-8 text-center">
          <div className="admin-login-logo-wrap mx-auto">
            <Image
              src={CLINIC_LOGO_URL}
              alt="Shiv Dental Clinic"
              width={96}
              height={96}
              className="admin-login-logo-pulse mx-auto rounded-2xl shadow-2xl ring-2 ring-[#f4c430]/50"
              priority
            />
          </div>
          <p className="admin-login-title-enter mt-5 text-xl font-bold tracking-tight text-white md:text-2xl">
            Shiv Dental Clinic
          </p>
          <p className="admin-login-subtitle-enter mt-2 text-sm text-slate-300">
            Staff login — appointments, patients &amp; messages
          </p>
        </div>

        <Suspense fallback={<div className="admin-login-form-skeleton h-[320px] w-full max-w-md rounded-2xl" />}>
          <LoginForm />
        </Suspense>

        <p className="admin-login-footer-enter mt-8 text-center text-xs text-slate-500">
          Secure access for authorized staff only
        </p>
      </div>
    </div>
  );
}
