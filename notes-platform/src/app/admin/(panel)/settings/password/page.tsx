"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
import { toast } from "sonner";

export default function AdminPasswordPage() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl font-bold">Change Password</h1>
      <form
        className="space-y-3 rounded-2xl border bg-white p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/api/admin/profile/password", { method: "PATCH", body: JSON.stringify(form) });
            toast.success("Password changed successfully.");
            setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed.");
          }
        }}
      >
        <Input type="password" placeholder="Current password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        <Input type="password" placeholder="New password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        <Input type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        <Button>Update Password</Button>
      </form>
    </div>
  );
}
