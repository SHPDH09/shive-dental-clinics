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
import { Loader2 } from "lucide-react";

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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`admin-login-form-enter mx-auto w-full max-w-md space-y-5 rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm ${shake ? "admin-login-shake" : ""}`}
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#0f1d3d]">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Use your Admin ID or email and password</p>
      </div>

      <div className="admin-login-field-enter admin-login-field-delay-1">
        <Label>Email or Admin ID</Label>
        <Input
          type="text"
          autoComplete="username"
          placeholder="admin@example.com"
          className="admin-login-input transition-shadow duration-300 focus:shadow-[0_0_0_3px_rgb(244_196_48/0.35)]"
          {...register("loginId")}
        />
      </div>
      <div className="admin-login-field-enter admin-login-field-delay-2">
        <Label>Password</Label>
        <Input
          type="password"
          autoComplete="current-password"
          className="admin-login-input transition-shadow duration-300 focus:shadow-[0_0_0_3px_rgb(244_196_48/0.35)]"
          {...register("password")}
        />
      </div>
      {error && (
        <p className="admin-login-error-enter text-sm font-medium text-[#d91f26]" role="alert">
          {error}
        </p>
      )}
      <div className="admin-login-field-enter admin-login-field-delay-3">
        <Button
          type="submit"
          className="admin-login-submit w-full transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </div>
    </form>
  );
}
