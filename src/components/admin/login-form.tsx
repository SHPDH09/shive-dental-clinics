"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { KeyRound, UserRound } from "lucide-react";
import { SdcLogoLoader } from "@/components/branding/sdc-logo-loader";

type FormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const authError = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    authError ? "Sign-in failed. Check email and password." : null,
  );
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!error) return;
    setShake(true);
    const t = window.setTimeout(() => setShake(false), 520);
    return () => window.clearTimeout(t);
  }, [error]);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    const loginId = data.loginId.trim();

    const direct = await fetch("/api/admin/session-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, password: data.password }),
    });
    if (direct.ok) {
      router.push(callbackUrl);
      router.refresh();
      return;
    }

    const res = await signIn("credentials", {
      loginId,
      password: data.password,
      redirect: false,
    });
    if (res?.error) {
      setError("Invalid email or Admin ID, or password. Please try again.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className={`admin-login-form-enter admin-login-card w-full ${shake ? "admin-login-shake" : ""}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-8 pt-7 md:p-9">
        <div className="text-center lg:text-left">
          <span className="admin-login-badge inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
            Staff portal
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#0f1d3d]">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-600">Sign in with your Admin ID or work email</p>
        </div>

        <div className="admin-login-field-enter admin-login-field-delay-1">
          <Label htmlFor="loginId">Email or Admin ID</Label>
          <div className="relative mt-1">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="loginId"
              type="text"
              autoComplete="username"
              placeholder="e.g. reception or admin@clinic.com"
              className="admin-login-input pl-10"
              {...register("loginId")}
            />
          </div>
        </div>

        <div className="admin-login-field-enter admin-login-field-delay-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className="admin-login-input pl-10"
              {...register("password")}
            />
          </div>
        </div>

        {error && (
          <div className="admin-login-error-enter rounded-xl border border-[#d91f26]/25 bg-[#d91f26]/5 px-4 py-3 text-sm font-medium text-[#b01820]" role="alert">
            {error}
          </div>
        )}

        <div className="admin-login-field-enter admin-login-field-delay-3 pt-1">
          <Button
            type="submit"
            className="admin-login-submit w-full py-3 text-base shadow-lg shadow-[#d91f26]/20 transition-transform duration-200 hover:scale-[1.01] hover:brightness-105 active:scale-[0.99]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <SdcLogoLoader size="xs" label="Signing in…" hideLabel inline className="mr-2 py-0" />
                Signing in…
              </>
            ) : (
              "Sign in to dashboard"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
