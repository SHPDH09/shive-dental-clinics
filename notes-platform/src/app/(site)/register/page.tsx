"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Create Student Account</h1>
      <form
        className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            await api("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
            toast.success("Account created. Please login.");
            router.push("/login");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Registration failed.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <Button className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already registered? <Link href="/login" className="text-indigo-600">Login</Link>
      </p>
    </div>
  );
}
