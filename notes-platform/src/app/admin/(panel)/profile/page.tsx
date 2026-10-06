"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
import { toast } from "sonner";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    void api<{ user: { name: string; email: string; phone?: string | null } }>("/api/admin/profile").then((d) =>
      setProfile({ name: d.user.name, email: d.user.email, phone: d.user.phone ?? "" }),
    );
  }, []);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl font-bold">Admin Profile</h1>
      <form
        className="space-y-3 rounded-2xl border bg-white p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          await api("/api/admin/profile", { method: "PATCH", body: JSON.stringify({ name: profile.name, phone: profile.phone }) });
          toast.success("Profile updated.");
        }}
      >
        <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
        <Input value={profile.email} disabled />
        <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
        <Button>Save</Button>
      </form>
    </div>
  );
}
