"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { LoadingState } from "@/components/admin/loading-state";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

type Settings = {
  clinicName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  seoTitle: string | null;
  seoDescription: string | null;
  aboutIntro: string | null;
  footerText: string | null;
};

export function SettingsView() {
  const [form, setForm] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<Settings>("/api/admin/settings").then(setForm);
  }, []);

  if (!form) return <LoadingState />;

  const update = (key: keyof Settings, value: string) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  };

  const onSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await adminFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setMessage("Settings saved.");
    } catch {
      setMessage("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-premium max-w-2xl space-y-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Clinic name</Label>
          <Input value={form.clinicName} onChange={(e) => update("clinicName", e.target.value)} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>
        <div>
          <Label>WhatsApp</Label>
          <Input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label>Address</Label>
          <Textarea rows={2} value={form.address} onChange={(e) => update("address", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label>About intro</Label>
          <Textarea rows={3} value={form.aboutIntro ?? ""} onChange={(e) => update("aboutIntro", e.target.value)} />
        </div>
        <div>
          <Label>SEO title</Label>
          <Input value={form.seoTitle ?? ""} onChange={(e) => update("seoTitle", e.target.value)} />
        </div>
        <div>
          <Label>SEO description</Label>
          <Input value={form.seoDescription ?? ""} onChange={(e) => update("seoDescription", e.target.value)} />
        </div>
      </div>
      {message && <p className="text-sm text-teal-700">{message}</p>}
      <Button type="button" onClick={onSave} disabled={saving}>Save settings</Button>
    </div>
  );
}
