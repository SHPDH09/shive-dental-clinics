"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import type { AdminSettingsResponse } from "@/lib/clinic-settings/types";
import {
  SETTINGS_SECTIONS,
  searchSettingsSections,
  type SettingsSectionId,
} from "@/lib/clinic-settings/search-index";
import { LoadingState } from "@/components/admin/loading-state";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RotateCcw, Save, Search } from "lucide-react";

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm">
      <span className="text-slate-700">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function SettingsView() {
  const [data, setData] = useState<AdminSettingsResponse | null>(null);
  const [baseline, setBaseline] = useState<AdminSettingsResponse | null>(null);
  const [section, setSection] = useState<SettingsSectionId>("general");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secretDraft, setSecretDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<AdminSettingsResponse>("/api/admin/settings");
      setData(res);
      setBaseline(structuredClone(res));
    } catch {
      setError("Super admin access required to manage settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const searchHits = useMemo(() => searchSettingsSections(search), [search]);

  useEffect(() => {
    if (searchHits.length > 0) setSection(searchHits[0]);
  }, [searchHits]);

  const patchExtended = (path: string[], value: unknown) => {
    setData((d) => {
      if (!d) return d;
      const next = structuredClone(d);
      let cursor: Record<string, unknown> = next.extended as unknown as Record<string, unknown>;
      for (let i = 0; i < path.length - 1; i++) {
        cursor = cursor[path[i]] as Record<string, unknown>;
      }
      cursor[path[path.length - 1]] = value;
      return next;
    });
  };

  const updateRoot = <K extends keyof AdminSettingsResponse>(key: K, value: AdminSettingsResponse[K]) => {
    setData((d) => (d ? { ...d, [key]: value } : d));
  };

  const onSave = async () => {
    if (!data) return;
    setSaving(true);
    setMessage(null);
    try {
      const {
        secretsMeta: _sm,
        updatedAt: _ua,
        extended,
        id: _id,
        ...root
      } = data;
      const payload: Record<string, unknown> = {
        ...root,
        extended,
        secrets: Object.fromEntries(
          Object.entries(secretDraft).filter(([, v]) => v && v !== "__UNCHANGED__"),
        ),
      };

      const saved = await adminFetch<AdminSettingsResponse>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setData(saved);
      setBaseline(structuredClone(saved));
      setSecretDraft({});
      setMessage("Settings updated successfully.");
    } catch {
      setMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    if (baseline) {
      setData(structuredClone(baseline));
      setSecretDraft({});
      setMessage("Changes reset.");
    }
  };

  const sendTestEmail = async () => {
    const to = prompt("Send test email to:");
    if (!to) return;
    try {
      const res = await adminFetch<{ message: string }>("/api/admin/settings/test-email", {
        method: "POST",
        body: JSON.stringify({ to }),
      });
      setMessage(res.message);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Test email failed");
    }
  };

  if (loading) return <LoadingState label="Loading settings…" />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return null;

  const ext = data.extended;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-56">
        <div className="card-premium sticky top-4 space-y-3 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm"
              placeholder="Search settings…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <nav className="max-h-[60vh] space-y-0.5 overflow-y-auto text-sm">
            {SETTINGS_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left",
                  section === s.id ? "bg-sky-50 font-medium text-sky-800" : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <span>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {SETTINGS_SECTIONS.find((s) => s.id === section)?.label}
          </h2>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onReset}>
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset changes
            </Button>
            <Button type="button" size="sm" disabled={saving} onClick={() => void onSave()}>
              <Save className="mr-1 h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        {message && <p className="rounded-xl bg-teal-50 px-4 py-2 text-sm text-teal-800">{message}</p>}

        <div className="card-premium space-y-6 p-6">
          {section === "general" && (
            <>
              <Field label="Clinic name">
                <Input value={data.clinicName} onChange={(e) => updateRoot("clinicName", e.target.value)} />
              </Field>
              <Field label="Tagline">
                <Input value={data.tagline ?? ""} onChange={(e) => updateRoot("tagline", e.target.value)} />
              </Field>
              <ImageUploadField label="Logo" folder="branding" value={data.logoUrl} onChange={(u) => updateRoot("logoUrl", u || null)} />
              <ImageUploadField label="Favicon" folder="branding" value={data.faviconUrl} onChange={(u) => updateRoot("faviconUrl", u || null)} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Default language">
                  <Input value={data.defaultLanguage} onChange={(e) => updateRoot("defaultLanguage", e.target.value)} />
                </Field>
                <Field label="Timezone">
                  <Input value={data.timezone} onChange={(e) => updateRoot("timezone", e.target.value)} />
                </Field>
                <Field label="Currency">
                  <Input value={data.currency} onChange={(e) => updateRoot("currency", e.target.value)} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Contact email">
                  <Input value={data.email} onChange={(e) => updateRoot("email", e.target.value)} />
                </Field>
                <Field label="Primary phone">
                  <Input value={data.phone} onChange={(e) => updateRoot("phone", e.target.value)} />
                </Field>
                <Field label="WhatsApp number">
                  <Input value={data.whatsapp} onChange={(e) => updateRoot("whatsapp", e.target.value)} />
                </Field>
              </div>
            </>
          )}

          {section === "clinic" && (
            <>
              <Field label="Clinic description">
                <Textarea rows={4} value={data.aboutIntro ?? ""} onChange={(e) => updateRoot("aboutIntro", e.target.value)} />
              </Field>
              <Field label="Address">
                <Textarea rows={2} value={data.address} onChange={(e) => updateRoot("address", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="City">
                  <Input value={data.city ?? ""} onChange={(e) => updateRoot("city", e.target.value)} />
                </Field>
                <Field label="State">
                  <Input value={data.state ?? ""} onChange={(e) => updateRoot("state", e.target.value)} />
                </Field>
                <Field label="PIN code">
                  <Input value={data.pinCode ?? ""} onChange={(e) => updateRoot("pinCode", e.target.value)} />
                </Field>
              </div>
              <Field label="Google Maps URL">
                <Input value={data.mapLink ?? ""} onChange={(e) => updateRoot("mapLink", e.target.value)} />
              </Field>
              <Field label="Google Business Profile URL">
                <Input value={data.googleBusinessUrl ?? ""} onChange={(e) => updateRoot("googleBusinessUrl", e.target.value)} />
              </Field>
              <Field label="Emergency contact">
                <Input value={data.emergencyContact ?? ""} onChange={(e) => updateRoot("emergencyContact", e.target.value)} />
              </Field>
            </>
          )}

          {section === "branches" && (
            <div className="space-y-4 text-sm text-slate-600">
              <p>Manage branch locations, doctors, and services from the Branches module.</p>
              <Toggle
                label="Show branch locator on homepage"
                checked={ext.branchSettings.showLocatorOnHome}
                onChange={(v) => patchExtended(["branchSettings", "showLocatorOnHome"], v)}
              />
              <Link href="/admin/branches" className="inline-flex text-sky-600 hover:underline">
                Open branch management →
              </Link>
            </div>
          )}

          {section === "hours" && (
            <>
              {Object.entries(ext.workingHours.days).map(([key, day]) => (
                <div key={key} className="grid gap-2 border-b border-slate-100 pb-4 sm:grid-cols-4 sm:items-center">
                  <span className="font-medium capitalize">{DAY_LABELS[key] ?? key}</span>
                  <Toggle
                    label="Closed"
                    checked={Boolean(day.closed)}
                    onChange={(v) => {
                      const days = { ...ext.workingHours.days, [key]: { ...day, closed: v } };
                      patchExtended(["workingHours", "days"], days);
                    }}
                  />
                  <Input
                    placeholder="Open"
                    value={day.open ?? ""}
                    onChange={(e) => {
                      const days = { ...ext.workingHours.days, [key]: { ...day, open: e.target.value } };
                      patchExtended(["workingHours", "days"], days);
                    }}
                  />
                  <Input
                    placeholder="Close"
                    value={day.close ?? ""}
                    onChange={(e) => {
                      const days = { ...ext.workingHours.days, [key]: { ...day, close: e.target.value } };
                      patchExtended(["workingHours", "days"], days);
                    }}
                  />
                </div>
              ))}
              <Field label="Holiday dates (comma-separated YYYY-MM-DD)">
                <Input
                  value={ext.workingHours.holidays.join(", ")}
                  onChange={(e) =>
                    patchExtended(
                      ["workingHours", "holidays"],
                      e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    )
                  }
                />
              </Field>
              <Field label="Emergency closure message">
                <Textarea
                  rows={2}
                  value={ext.workingHours.emergencyClosureMessage ?? ""}
                  onChange={(e) => patchExtended(["workingHours", "emergencyClosureMessage"], e.target.value)}
                />
              </Field>
            </>
          )}

          {section === "appointments" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Appointment duration (minutes)">
                <Input
                  type="number"
                  value={ext.appointments.durationMinutes}
                  onChange={(e) => patchExtended(["appointments", "durationMinutes"], Number(e.target.value))}
                />
              </Field>
              <Field label="Buffer time (minutes)">
                <Input
                  type="number"
                  value={ext.appointments.bufferMinutes}
                  onChange={(e) => patchExtended(["appointments", "bufferMinutes"], Number(e.target.value))}
                />
              </Field>
              <Field label="Minimum booking notice (hours)">
                <Input
                  type="number"
                  value={ext.appointments.minNoticeHours}
                  onChange={(e) => patchExtended(["appointments", "minNoticeHours"], Number(e.target.value))}
                />
              </Field>
              <Field label="Max advance booking (days)">
                <Input
                  type="number"
                  value={ext.appointments.maxAdvanceDays}
                  onChange={(e) => patchExtended(["appointments", "maxAdvanceDays"], Number(e.target.value))}
                />
              </Field>
              <Toggle label="Same-day booking" checked={ext.appointments.sameDayBooking} onChange={(v) => patchExtended(["appointments", "sameDayBooking"], v)} />
              <Toggle label="Auto-confirm appointments" checked={ext.appointments.autoConfirm} onChange={(v) => patchExtended(["appointments", "autoConfirm"], v)} />
              <Toggle label="Require admin approval" checked={ext.appointments.requireAdminApproval} onChange={(v) => patchExtended(["appointments", "requireAdminApproval"], v)} />
              <Toggle label="Allow cancellation" checked={ext.appointments.allowCancellation} onChange={(v) => patchExtended(["appointments", "allowCancellation"], v)} />
              <Field label="Cancellation deadline (hours before)">
                <Input
                  type="number"
                  value={ext.appointments.cancellationDeadlineHours}
                  onChange={(e) => patchExtended(["appointments", "cancellationDeadlineHours"], Number(e.target.value))}
                />
              </Field>
              <Field label="No-show handling">
                <Input value={ext.appointments.noShowHandling} onChange={(e) => patchExtended(["appointments", "noShowHandling"], e.target.value)} />
              </Field>
            </div>
          )}

          {section === "notifications" && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-800">Admin notifications</h3>
                {Object.entries(ext.notifications.admin).map(([key, val]) => (
                  <Toggle
                    key={key}
                    label={key.replace(/([A-Z])/g, " $1")}
                    checked={val}
                    onChange={(v) => {
                      patchExtended(["notifications", "admin"], { ...ext.notifications.admin, [key]: v });
                    }}
                  />
                ))}
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-800">Patient notifications</h3>
                {Object.entries(ext.notifications.patient).map(([key, val]) => (
                  <Toggle
                    key={key}
                    label={key.replace(/([A-Z])/g, " $1")}
                    checked={val}
                    onChange={(v) => {
                      patchExtended(["notifications", "patient"], { ...ext.notifications.patient, [key]: v });
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {section === "whatsapp" && (
            <>
              <Field label="WhatsApp CTA message">
                <Textarea rows={2} value={ext.whatsapp.ctaMessage} onChange={(e) => patchExtended(["whatsapp", "ctaMessage"], e.target.value)} />
              </Field>
              <Field label="Appointment template">
                <Textarea rows={2} value={ext.whatsapp.appointmentTemplate} onChange={(e) => patchExtended(["whatsapp", "appointmentTemplate"], e.target.value)} />
              </Field>
              <Field label="Enquiry response template">
                <Textarea rows={2} value={ext.whatsapp.enquiryTemplate} onChange={(e) => patchExtended(["whatsapp", "enquiryTemplate"], e.target.value)} />
              </Field>
              <Field label="Reminder template">
                <Textarea rows={2} value={ext.whatsapp.reminderTemplate} onChange={(e) => patchExtended(["whatsapp", "reminderTemplate"], e.target.value)} />
              </Field>
              <a
                href={`https://wa.me/${data.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(ext.whatsapp.ctaMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white"
              >
                Open WhatsApp preview
              </a>
            </>
          )}

          {section === "email" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sender name">
                  <Input value={ext.email.senderName} onChange={(e) => patchExtended(["email", "senderName"], e.target.value)} />
                </Field>
                <Field label="Sender email">
                  <Input value={ext.email.senderEmail} onChange={(e) => patchExtended(["email", "senderEmail"], e.target.value)} />
                </Field>
                <Field label="Reply-to email">
                  <Input value={ext.email.replyTo} onChange={(e) => patchExtended(["email", "replyTo"], e.target.value)} />
                </Field>
                <Field label="SMTP provider">
                  <Input value={ext.email.smtpProvider} onChange={(e) => patchExtended(["email", "smtpProvider"], e.target.value)} />
                </Field>
                <Field label="SMTP host">
                  <Input value={ext.email.smtpHost} onChange={(e) => patchExtended(["email", "smtpHost"], e.target.value)} />
                </Field>
                <Field label="SMTP port">
                  <Input type="number" value={ext.email.smtpPort} onChange={(e) => patchExtended(["email", "smtpPort"], Number(e.target.value))} />
                </Field>
                <Field label="SMTP username">
                  <Input value={ext.email.smtpUsername} onChange={(e) => patchExtended(["email", "smtpUsername"], e.target.value)} />
                </Field>
                <Field label="SMTP password">
                  <Input
                    type="password"
                    placeholder={data.secretsMeta.smtpPassword ? "•••••••• (unchanged)" : "Enter password"}
                    value={secretDraft.smtpPassword ?? ""}
                    onChange={(e) => setSecretDraft((s) => ({ ...s, smtpPassword: e.target.value }))}
                  />
                </Field>
                <Field label="Encryption">
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={ext.email.encryption}
                    onChange={(e) => patchExtended(["email", "encryption"], e.target.value)}
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">None</option>
                  </select>
                </Field>
              </div>
              <Button type="button" variant="secondary" onClick={() => void sendTestEmail()}>
                Send test email
              </Button>
            </>
          )}

          {section === "seo" && (
            <>
              <Field label="Website title">
                <Input value={data.seoTitle ?? ""} onChange={(e) => updateRoot("seoTitle", e.target.value)} />
              </Field>
              <Field label="Meta description">
                <Textarea rows={2} value={data.seoDescription ?? ""} onChange={(e) => updateRoot("seoDescription", e.target.value)} />
              </Field>
              <Field label="Keywords">
                <Input value={ext.seo.keywords} onChange={(e) => patchExtended(["seo", "keywords"], e.target.value)} />
              </Field>
              <ImageUploadField label="Open Graph image" folder="branding" value={ext.seo.ogImageUrl || null} onChange={(u) => patchExtended(["seo", "ogImageUrl"], u)} />
              <Field label="Canonical URL">
                <Input value={ext.seo.canonicalUrl} onChange={(e) => patchExtended(["seo", "canonicalUrl"], e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Instagram">
                  <Input
                    value={(data.socialLinks as Record<string, string>)?.instagram ?? ""}
                    onChange={(e) =>
                      updateRoot("socialLinks", { ...(data.socialLinks as object), instagram: e.target.value })
                    }
                  />
                </Field>
                <Field label="Facebook">
                  <Input
                    value={(data.socialLinks as Record<string, string>)?.facebook ?? ""}
                    onChange={(e) =>
                      updateRoot("socialLinks", { ...(data.socialLinks as object), facebook: e.target.value })
                    }
                  />
                </Field>
                <Field label="YouTube">
                  <Input
                    value={(data.socialLinks as Record<string, string>)?.youtube ?? ""}
                    onChange={(e) =>
                      updateRoot("socialLinks", { ...(data.socialLinks as object), youtube: e.target.value })
                    }
                  />
                </Field>
              </div>
              <Toggle label="Enable sitemap" checked={ext.seo.sitemapEnabled} onChange={(v) => patchExtended(["seo", "sitemapEnabled"], v)} />
              <Toggle label="Allow search indexing (robots)" checked={ext.seo.robotsIndex} onChange={(v) => patchExtended(["seo", "robotsIndex"], v)} />
              <Field label="Google Analytics ID">
                <Input value={ext.seo.googleAnalyticsId} onChange={(e) => patchExtended(["seo", "googleAnalyticsId"], e.target.value)} />
              </Field>
              <Field label="Search Console verification tag">
                <Input value={ext.seo.googleSearchConsoleTag} onChange={(e) => patchExtended(["seo", "googleSearchConsoleTag"], e.target.value)} />
              </Field>
            </>
          )}

          {section === "appearance" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Primary brand color">
                  <Input type="color" value={ext.appearance.primaryColor} onChange={(e) => patchExtended(["appearance", "primaryColor"], e.target.value)} />
                </Field>
                <Field label="Secondary color">
                  <Input type="color" value={ext.appearance.secondaryColor} onChange={(e) => patchExtended(["appearance", "secondaryColor"], e.target.value)} />
                </Field>
              </div>
              <ImageUploadField label="Homepage hero image" folder="branding" value={ext.appearance.heroImageUrl || null} onChange={(u) => patchExtended(["appearance", "heroImageUrl"], u)} />
              <Field label="Font family">
                <Input value={ext.appearance.fontFamily} onChange={(e) => patchExtended(["appearance", "fontFamily"], e.target.value)} />
              </Field>
              <Field label="Button style">
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={ext.appearance.buttonStyle}
                  onChange={(e) => patchExtended(["appearance", "buttonStyle"], e.target.value)}
                >
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill</option>
                  <option value="square">Square</option>
                </select>
              </Field>
              <Field label="Theme preference">
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={ext.appearance.themePreference}
                  onChange={(e) => patchExtended(["appearance", "themePreference"], e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </Field>
            </>
          )}

          {section === "security" && (
            <>
              <Field label="Session timeout (minutes)">
                <Input
                  type="number"
                  value={ext.security.sessionTimeoutMinutes}
                  onChange={(e) => patchExtended(["security", "sessionTimeoutMinutes"], Number(e.target.value))}
                />
              </Field>
              <Toggle label="Two-factor authentication" checked={ext.security.twoFactorEnabled} onChange={(v) => patchExtended(["security", "twoFactorEnabled"], v)} />
              <Toggle label="Login attempt protection" checked={ext.security.loginProtectionEnabled} onChange={(v) => patchExtended(["security", "loginProtectionEnabled"], v)} />
              <Field label="Minimum password length">
                <Input type="number" value={ext.security.passwordMinLength} onChange={(e) => patchExtended(["security", "passwordMinLength"], Number(e.target.value))} />
              </Field>
              <Toggle label="Require uppercase" checked={ext.security.requireUppercase} onChange={(v) => patchExtended(["security", "requireUppercase"], v)} />
              <Toggle label="Require number" checked={ext.security.requireNumber} onChange={(v) => patchExtended(["security", "requireNumber"], v)} />
              <p className="text-sm text-slate-500">
                Staff password changes are managed under Admin accounts (super admin) or your profile when enabled.
              </p>
            </>
          )}

          {section === "roles" && (
            <div className="space-y-3 text-sm text-slate-600">
              <p>Configure admin roles, module permissions, and staff accounts in Admin Management.</p>
              <Link href="/admin/admins" className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-white">
                Open Admin Management
              </Link>
            </div>
          )}

          {section === "payment" && (
            <>
              <Field label="Payment provider">
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={ext.payment.provider}
                  onChange={(e) => patchExtended(["payment", "provider"], e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="cashfree">Cashfree</option>
                  <option value="stripe">Stripe</option>
                </select>
              </Field>
              <Field label="API key">
                <Input
                  type="password"
                  placeholder={data.secretsMeta.paymentApiKey ? "••••••••" : "Enter API key"}
                  value={secretDraft.paymentApiKey ?? ""}
                  onChange={(e) => setSecretDraft((s) => ({ ...s, paymentApiKey: e.target.value }))}
                />
              </Field>
              <Field label="API secret">
                <Input
                  type="password"
                  placeholder={data.secretsMeta.paymentApiSecret ? "••••••••" : "Enter secret"}
                  value={secretDraft.paymentApiSecret ?? ""}
                  onChange={(e) => setSecretDraft((s) => ({ ...s, paymentApiSecret: e.target.value }))}
                />
              </Field>
              <Field label="Success URL">
                <Input value={ext.payment.successUrl} onChange={(e) => patchExtended(["payment", "successUrl"], e.target.value)} />
              </Field>
              <Field label="Failure URL">
                <Input value={ext.payment.failureUrl} onChange={(e) => patchExtended(["payment", "failureUrl"], e.target.value)} />
              </Field>
              <Field label="Webhook URL">
                <Input value={ext.payment.webhookUrl} onChange={(e) => patchExtended(["payment", "webhookUrl"], e.target.value)} />
              </Field>
            </>
          )}

          {section === "integrations" && (
            <ul className="space-y-3">
              {Object.entries(ext.integrations).map(([key, row]) => (
                <li key={key} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-800">{row.label}</p>
                    {row.note && <p className="text-xs text-slate-500">{row.note}</p>}
                  </div>
                  <Toggle
                    label=""
                    checked={row.connected}
                    onChange={(v) =>
                      patchExtended(["integrations", key], { ...row, connected: v })
                    }
                  />
                </li>
              ))}
            </ul>
          )}

          {section === "legal" && (
            <>
              {Object.entries(ext.legal).map(([key, page]) => (
                <div key={key} className="space-y-2 border-b border-slate-100 pb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{page.title}</h3>
                    <Toggle
                      label="Published"
                      checked={page.published}
                      onChange={(v) =>
                        patchExtended(["legal", key], { ...page, published: v })
                      }
                    />
                  </div>
                  <Textarea
                    rows={6}
                    value={page.content}
                    onChange={(e) => patchExtended(["legal", key], { ...page, content: e.target.value })}
                  />
                </div>
              ))}
            </>
          )}

          {section === "data" && (
            <div className="space-y-4 text-sm">
              <Field label="Data retention (days)">
                <Input
                  type="number"
                  value={ext.dataManagement.retentionDays}
                  onChange={(e) => patchExtended(["dataManagement", "retentionDays"], Number(e.target.value))}
                />
              </Field>
              <Toggle label="Allow patient data export" checked={ext.dataManagement.allowPatientExport} onChange={(v) => patchExtended(["dataManagement", "allowPatientExport"], v)} />
              <p className="text-slate-600">Export clinic data from Reports (CSV / Excel).</p>
              <Link href="/admin/reports" className="text-sky-600 hover:underline">
                Open Reports & export →
              </Link>
              <Button
                type="button"
                variant="secondary"
                className="text-red-600"
                onClick={() => {
                  if (
                    confirm(
                      "Delete old patient records? This requires explicit confirmation and super admin approval. (Export a backup first.)",
                    )
                  ) {
                    setMessage("Destructive delete is disabled in this build — export data and contact support.");
                  }
                }}
              >
                Delete old records (protected)
              </Button>
            </div>
          )}

          {section === "maintenance" && (
            <>
              <Toggle
                label="Enable maintenance mode (public site)"
                checked={ext.maintenance.enabled}
                onChange={(v) => patchExtended(["maintenance", "enabled"], v)}
              />
              <Field label="Custom message">
                <Textarea rows={3} value={ext.maintenance.message} onChange={(e) => patchExtended(["maintenance", "message"], e.target.value)} />
              </Field>
              <p className="text-xs text-slate-500">Admins can still access /admin while maintenance mode is on.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
