"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        className="w-full max-w-md space-y-4 rounded-2xl border bg-white p-6 shadow-xl"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          const res = await signIn("credentials", {
            email: form.email,
            password: form.password,
            intent: "admin",
            redirect: false,
          });
          setLoading(false);
          if (res?.error) {
            toast.error("Invalid admin credentials.");
            return;
          }
          router.push("/admin");
        }}
      >
        <h1 className="text-2xl font-bold">Admin Login</h1>
        <Input type="email" placeholder="Admin email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <Button className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </Button>
      </form>
    </div>
  );
}
