import { LoginForm } from "@/components/admin/login-form";
import Image from "next/image";
import { CLINIC_LOGO_URL } from "@/lib/branding";
import { Suspense } from "react";

export default function AdminLoginPage() {
  return (
    <div className="admin-login-bg flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <Image src={CLINIC_LOGO_URL} alt="Shiv Dental Clinic" width={88} height={88} className="mx-auto rounded-2xl shadow-lg ring-2 ring-[#f4c430]/40" priority />
        <p className="mt-4 text-lg font-semibold text-white">Shiv Dental Clinic</p>
        <p className="mt-1 text-sm text-slate-300">Staff login — appointments, patients & messages</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
