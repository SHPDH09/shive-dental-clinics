import { LoginForm } from "@/components/admin/login-form";
import { Suspense } from "react";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-slate-100 px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
