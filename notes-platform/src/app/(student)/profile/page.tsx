"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
import { toast } from "sonner";

export default function ProfilePage() {
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    void api<{ user: { name: string; email: string; phone?: string | null } }>("/api/profile").then((d) =>
      setProfile({ name: d.user.name, email: d.user.email, phone: d.user.phone ?? "" }),
    );
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold">Profile</h1>
      <form
        className="space-y-3 rounded-2xl border bg-white p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/api/profile", { method: "PATCH", body: JSON.stringify({ name: profile.name, phone: profile.phone }) });
            toast.success("Profile updated.");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Update failed.");
          }
        }}
      >
        <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Full name" />
        <Input value={profile.email} disabled />
        <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="Phone" />
        <Button>Save Profile</Button>
      </form>

      <form
        className="space-y-3 rounded-2xl border bg-white p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/api/profile/password", { method: "PATCH", body: JSON.stringify(passwords) });
            toast.success("Password changed.");
            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Password change failed.");
          }
        }}
      >
        <h2 className="font-semibold">Change Password</h2>
        <Input type="password" placeholder="Current password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
        <Input type="password" placeholder="New password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
        <Input type="password" placeholder="Confirm password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
        <Button variant="secondary">Update Password</Button>
      </form>
    </div>
  );
}
