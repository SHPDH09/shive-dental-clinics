"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useState } from "react";

type FormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const authError = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    authError ? "Sign-in failed. Check email and password." : null,
  );

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
    <form onSubmit={handleSubmit(onSubmit)} className="card-premium mx-auto w-full max-w-md space-y-5 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Shiv Dental Clinic — admin portal</p>
      </div>

      <div>
        <Label>Email or Admin ID</Label>
        <Input
          type="text"
          autoComplete="username"
          placeholder="admin@example.com"
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
