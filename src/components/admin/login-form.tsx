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

type FormValues = z.infer<typeof loginSchema>;

type LoginHints = {
  authSecretOk: boolean;
  databaseOk: boolean;
  envFallbackOk?: boolean;
  supabaseConfigured?: boolean;
  message: string;
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const authError = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    authError ? "Sign-in failed. See the checklist below." : null,
  );
  const [hints, setHints] = useState<LoginHints | null>(null);

  useEffect(() => {
    fetch("/api/health/login-hints")
      .then((r) => r.json())
      .then(setHints)
      .catch(() => null);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    const res = await signIn("credentials", {
      loginId: data.loginId.trim(),
      password: data.password,
      redirect: false,
    });
    if (res?.error) {
      if (hints && !hints.authSecretOk) {
        setError("AUTH_SECRET is missing on the server. Add it in Cloudflare → Variables (Encrypt), then redeploy.");
      } else if (hints && !hints.databaseOk && !hints.envFallbackOk) {
        setError(
          "Database is not connected and no emergency admin is configured. Fix DATABASE_URL or set ADMIN_LOGIN_ID + ADMIN_PASSWORD in Cloudflare.",
        );
      } else {
        setError("Invalid Admin ID or password.");
      }
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card-premium mx-auto w-full max-w-md space-y-5 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Shiv Dental Clinic — authorized staff only</p>
      </div>

      {hints && (
        <div
          className={`rounded-xl border p-3 text-xs leading-relaxed ${
            hints.authSecretOk && (hints.databaseOk || hints.envFallbackOk)
              ? "border-teal-200 bg-teal-50 text-teal-900"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          <p className="font-semibold">Server checklist</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>AUTH_SECRET: {hints.authSecretOk ? "OK" : "Missing — add in Cloudflare"}</li>
            <li>Database: {hints.databaseOk ? "Connected" : "Not connected"}</li>
            <li>Supabase: {hints.supabaseConfigured ? "Configured" : "Not configured"}</li>
            <li>
              Emergency login:{" "}
              {hints.envFallbackOk ? "Configured (Cloudflare secrets)" : "Not configured"}
            </li>
          </ul>
          <p className="mt-2">{hints.message}</p>
        </div>
      )}

      <div>
        <Label>Admin ID or email</Label>
        <Input
          type="text"
          autoComplete="username"
          placeholder="Admin ID or email"
          {...register("loginId")}
        />
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" autoComplete="current-password" {...register("password")} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}
