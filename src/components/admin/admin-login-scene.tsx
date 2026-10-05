"use client";

import Image from "next/image";
import Link from "next/link";
import { CLINIC_LOGO_URL } from "@/lib/branding";
import { SdcLogoLoader } from "@/components/branding/sdc-logo-loader";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { Calendar, ExternalLink, ShieldCheck, Users } from "lucide-react";

const FEATURES = [
  { icon: Calendar, label: "Appointments & daily schedule" },
  { icon: Users, label: "Patients, leads & follow-ups" },
  { icon: ShieldCheck, label: "Secure staff-only access" },
] as const;

export function AdminLoginScene() {
  return (
    <div className="admin-login-theme admin-login-bg relative min-h-screen overflow-hidden">
      <div className="admin-login-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="admin-login-orb admin-login-orb-a pointer-events-none" aria-hidden />
      <div className="admin-login-orb admin-login-orb-b pointer-events-none" aria-hidden />
      <div className="admin-login-orb admin-login-orb-c pointer-events-none" aria-hidden />
      <div className="admin-login-accent-bar pointer-events-none absolute left-0 right-0 top-0 h-1" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-12 lg:px-10">
        <aside className="admin-login-showcase hidden w-full flex-col justify-center pr-10 lg:flex lg:max-w-[52%]">
          <div className="admin-login-brand-enter">
            <div className="admin-login-logo-wrap inline-block">
              <Image
                src={CLINIC_LOGO_URL}
                alt="Shiv Dental Clinic"
                width={112}
                height={112}
                className="admin-login-logo-pulse rounded-2xl shadow-2xl ring-2 ring-[#f4c430]/55"
                priority
              />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#f4c430]">Shiv Dental Clinic</p>
            <h1 className="admin-login-title-enter mt-3 text-4xl font-bold leading-tight tracking-tight text-white xl:text-[2.75rem]">
              Your clinic,
              <span className="mt-1 block text-[#f4c430]">one simple dashboard</span>
            </h1>
            <p className="admin-login-subtitle-enter mt-4 max-w-md text-base leading-relaxed text-slate-300">
              Manage bookings, patient records, and messages in one place — built for reception and clinical staff.
            </p>
          </div>

          <ul className="admin-login-features-enter mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4c430]/15 text-[#f4c430]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-medium text-slate-100">{label}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/"
            className="admin-login-footer-enter mt-10 inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-[#f4c430]"
          >
            Visit public website
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Link>
        </aside>

        <div className="flex w-full flex-col items-center lg:ml-auto lg:w-[min(100%,28rem)] lg:items-stretch">
          <div className="admin-login-brand-enter mb-8 text-center lg:hidden">
            <div className="admin-login-logo-wrap mx-auto inline-block">
              <Image
                src={CLINIC_LOGO_URL}
                alt="Shiv Dental Clinic"
                width={88}
                height={88}
                className="admin-login-logo-pulse rounded-2xl shadow-2xl ring-2 ring-[#f4c430]/50"
                priority
              />
            </div>
            <p className="mt-4 text-lg font-bold text-white">Shiv Dental Clinic</p>
            <p className="mt-1 text-sm text-slate-400">Staff admin portal</p>
          </div>

          <Suspense
            fallback={
              <div className="admin-login-form-skeleton flex h-[360px] w-full items-center justify-center rounded-2xl">
                <SdcLogoLoader size="md" label="Loading login…" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>

          <p className="admin-login-footer-enter mt-6 text-center text-xs text-slate-500 lg:text-left">
            Authorized staff only · Contact your admin if you need access
          </p>
        </div>
      </div>
    </div>
  );
}
