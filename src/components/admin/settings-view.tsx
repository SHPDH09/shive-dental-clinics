"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { LoadingState } from "@/components/admin/loading-state";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

type Settings = {
  clinicName: string;
  logoUrl: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  emergencyContact: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  aboutIntro: string | null;
  mission: string | null;
  vision: string | null;
  whyChooseUs: string | null;
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

  const update = (key: keyof Settings, value: string | null) => {
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
      setMessage("Clinic details saved.");
    } catch {
      setMessage("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-premium max-w-3xl space-y-8 p-6">
      <section className="space-y-4">
        <h3 className="font-bold text-slate-900">Clinic identity</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Clinic name</Label>
            <Input value={form.clinicName} onChange={(e) => update("clinicName", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <ImageUploadField
              label="Clinic logo"
              folder="branding"
              value={form.logoUrl}
              onChange={(url) => update("logoUrl", url || null)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-bold text-slate-900">Contact</h3>
        <div className="grid gap-4 sm:grid-cols-2">
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
          <div>
            <Label>Emergency contact</Label>
            <Input value={form.emergencyContact ?? ""} onChange={(e) => update("emergencyContact", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Address</Label>
            <Textarea rows={2} value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-bold text-slate-900">About (homepage)</h3>
        <div className="space-y-4">
          <div>
            <Label>Introduction</Label>
            <Textarea rows={3} value={form.aboutIntro ?? ""} onChange={(e) => update("aboutIntro", e.target.value)} />
          </div>
          <div>
            <Label>Mission</Label>
            <Textarea rows={2} value={form.mission ?? ""} onChange={(e) => update("mission", e.target.value)} />
          </div>
          <div>
            <Label>Vision</Label>
            <Textarea rows={2} value={form.vision ?? ""} onChange={(e) => update("vision", e.target.value)} />
          </div>
          <div>
            <Label>Why choose us</Label>
            <Textarea rows={3} value={form.whyChooseUs ?? ""} onChange={(e) => update("whyChooseUs", e.target.value)} />
          </div>
          <div>
            <Label>Footer text</Label>
            <Input value={form.footerText ?? ""} onChange={(e) => update("footerText", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-bold text-slate-900">SEO</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>SEO title</Label>
            <Input value={form.seoTitle ?? ""} onChange={(e) => update("seoTitle", e.target.value)} />
          </div>
          <div>
            <Label>SEO description</Label>
            <Input value={form.seoDescription ?? ""} onChange={(e) => update("seoDescription", e.target.value)} />
          </div>
        </div>
      </section>

      {message && <p className="text-sm text-teal-700">{message}</p>}
      <Button type="button" onClick={onSave} disabled={saving}>
        Save clinic details
      </Button>
    </div>
  );
}
