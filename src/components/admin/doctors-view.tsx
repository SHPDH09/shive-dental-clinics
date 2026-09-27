"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { adminFetch } from "@/lib/admin-client";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState } from "@/components/admin/loading-state";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  DEFAULT_WEEKLY_SCHEDULE,
  WEEKDAY_KEYS,
  type DaySchedule,
  type WeeklySchedule,
  formatConsultationSummary,
  parseWeeklySchedule,
} from "@/lib/doctor-schedule";
import { slugify } from "@/lib/utils";
import { Eye, EyeOff, ExternalLink, Pencil, Plus, Star, Trash2 } from "lucide-react";

type DoctorRecord = {
  id: string;
  name: string;
  slug: string;
  qualification: string;
  specialization: string;
  experienceYears: number;
  bio: string;
  summary: string | null;
  registrationNumber: string | null;
  phone: string | null;
  image: string | null;
  areasOfExpertise: string[] | unknown;
  languagesSpoken: string | null;
  weeklySchedule: WeeklySchedule | unknown;
  consultationHours: string | null;
  featured: boolean;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
};

type DoctorForm = {
  name: string;
  slug: string;
  qualification: string;
  specialization: string;
  experienceYears: number;
  bio: string;
  summary: string;
  registrationNumber: string;
  phone: string;
  image: string;
  areasOfExpertise: string[];
  languagesSpoken: string;
  weeklySchedule: WeeklySchedule;
  featured: boolean;
  enabled: boolean;
  sortOrder: number;
};

function asExpertise(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

const emptyForm: DoctorForm = {
  name: "",
  slug: "",
  qualification: "",
  specialization: "",
  experienceYears: 5,
  bio: "",
  summary: "",
  registrationNumber: "",
  phone: "",
  image: "",
  areasOfExpertise: [""],
  languagesSpoken: "",
  weeklySchedule: { ...DEFAULT_WEEKLY_SCHEDULE },
  featured: false,
  enabled: true,
  sortOrder: 0,
};

export function DoctorsView() {
  const [items, setItems] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DoctorForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterSpec, setFilterSpec] = useState("");
  const [filterPublished, setFilterPublished] = useState<"" | "true" | "false">("");
  const [sort, setSort] = useState<"newest" | "experience" | "name">("newest");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100", sort });
      if (search.trim()) params.set("q", search.trim());
      if (filterSpec.trim()) params.set("specialization", filterSpec.trim());
      if (filterPublished) params.set("enabled", filterPublished);
      const data = await adminFetch<{ items: DoctorRecord[] }>(`/api/admin/doctors?${params}`);
      setItems(data.items ?? []);
    } catch {
      setError("Could not load doctors.");
    } finally {
      setLoading(false);
    }
  }, [search, filterSpec, filterPublished, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
    setMessage(null);
  };

  const openEdit = (d: DoctorRecord) => {
    setEditingId(d.id);
    const expertise = asExpertise(d.areasOfExpertise);
    setForm({
      name: d.name,
      slug: d.slug,
      qualification: d.qualification,
      specialization: d.specialization,
      experienceYears: d.experienceYears,
      bio: d.bio,
      summary: d.summary ?? "",
      registrationNumber: d.registrationNumber ?? "",
      phone: d.phone ?? "",
      image: d.image ?? "",
      areasOfExpertise: expertise.length ? expertise : [""],
      languagesSpoken: d.languagesSpoken ?? "",
      weeklySchedule: parseWeeklySchedule(d.weeklySchedule),
      featured: d.featured,
      enabled: d.enabled,
      sortOrder: d.sortOrder,
    });
    setFormOpen(true);
    setMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const schedule = form.weeklySchedule;
    const payload = {
      ...form,
      slug: form.slug.trim() || slugify(form.name),
      experienceYears: Number(form.experienceYears) || 0,
      areasOfExpertise: form.areasOfExpertise.map((e) => e.trim()).filter(Boolean),
      weeklySchedule: schedule,
      consultationHours: formatConsultationSummary(schedule),
      registrationNumber: form.registrationNumber || undefined,
      phone: form.phone || undefined,
    };
    try {
      if (editingId) {
        await adminFetch(`/api/admin/doctors/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setMessage("Doctor profile updated.");
      } else {
        await adminFetch("/api/admin/doctors", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Doctor profile added.");
      }
      setFormOpen(false);
      await load();
    } catch {
      setMessage("Save failed. Check required fields and photo.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (d: DoctorRecord) => {
    await adminFetch(`/api/admin/doctors/${d.id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: !d.enabled }),
    });
    await load();
  };

  const toggleFeatured = async (d: DoctorRecord) => {
    await adminFetch(`/api/admin/doctors/${d.id}`, {
      method: "PATCH",
      body: JSON.stringify({ featured: !d.featured }),
    });
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this doctor profile?")) return;
    await adminFetch(`/api/admin/doctors/${id}`, { method: "DELETE" });
    await load();
  };

  const setDay = (key: keyof WeeklySchedule, patch: Partial<DaySchedule>) => {
    setForm((f) => ({
      ...f,
      weeklySchedule: {
        ...f.weeklySchedule,
        [key]: { ...f.weeklySchedule[key], ...patch },
      },
    }));
  };

  if (loading && items.length === 0) return <LoadingState />;
  if (error && items.length === 0) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-2 lg:grid-cols-4">
        <Input placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Input
          placeholder="Filter specialization…"
          value={filterSpec}
          onChange={(e) => setFilterSpec(e.target.value)}
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={filterPublished}
          onChange={(e) => setFilterPublished(e.target.value as "" | "true" | "false")}
        >
          <option value="">All statuses</option>
          <option value="true">Published</option>
          <option value="false">Unpublished</option>
        </select>
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
        >
          <option value="newest">Newest</option>
          <option value="experience">Most experience</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add doctor
        </Button>
      </div>

      {message && <p className="text-sm text-teal-700">{message}</p>}

      <DataTable
        headers={["Photo", "Name", "Qualification", "Specialization", "Exp.", "Availability", "Status", "Actions"]}
        empty={items.length === 0}
      >
        {items.map((d) => (
          <tr key={d.id}>
            <td className="px-2 py-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-slate-100">
                {d.image ? (
                  <Image src={d.image} alt="" fill className="object-cover" sizes="48px" />
                ) : (
                  <span className="flex h-full items-center justify-center text-lg">👨‍⚕️</span>
                )}
              </div>
            </td>
            <td className="px-4 py-3 font-medium">{d.name}</td>
            <td className="px-4 py-3 text-sm text-slate-600 max-w-[140px] truncate">{d.qualification}</td>
            <td className="px-4 py-3">{d.specialization}</td>
            <td className="px-4 py-3">{d.experienceYears}y</td>
            <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px] truncate">
              {d.consultationHours ?? formatConsultationSummary(parseWeeklySchedule(d.weeklySchedule))}
            </td>
            <td className="px-4 py-3 text-sm">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  d.enabled ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-600"
                }`}
              >
                {d.enabled ? "Published" : "Draft"}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                <button type="button" className="rounded p-1 hover:bg-slate-100" onClick={() => openEdit(d)}>
                  <Pencil className="h-4 w-4" />
                </button>
                <a
                  href={`/doctors/${d.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1 hover:bg-slate-100"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button type="button" className="rounded p-1 hover:bg-slate-100" onClick={() => void togglePublish(d)}>
                  {d.enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  className={`rounded p-1 hover:bg-slate-100 ${d.featured ? "text-amber-500" : ""}`}
                  onClick={() => void toggleFeatured(d)}
                >
                  <Star className="h-4 w-4" />
                </button>
                <button type="button" className="rounded p-1 text-red-600 hover:bg-red-50" onClick={() => void remove(d.id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {formOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
          <div className="mx-auto my-8 max-w-3xl card-premium p-6 md:p-8">
            <h3 className="text-lg font-bold">{editingId ? "Edit doctor" : "Add doctor"}</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Doctor name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      slug: f.slug || slugify(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label>Qualification *</Label>
                <Input value={form.qualification} onChange={(e) => setForm((f) => ({ ...f, qualification: e.target.value }))} />
              </div>
              <div>
                <Label>Specialization *</Label>
                <Input value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} />
              </div>
              <div>
                <Label>Years of experience *</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.experienceYears}
                  onChange={(e) => setForm((f) => ({ ...f, experienceYears: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>
              <div className="sm:col-span-2">
                <ImageUploadField
                  label="Profile photo *"
                  folder="doctors"
                  value={form.image || null}
                  onChange={(url) => setForm((f) => ({ ...f, image: url }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Short bio *</Label>
                <Textarea rows={2} value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label>Detailed biography *</Label>
                <Textarea rows={4} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label>Languages spoken</Label>
                <Input value={form.languagesSpoken} onChange={(e) => setForm((f) => ({ ...f, languagesSpoken: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label>Registration number (admin only — not shown on public site)</Label>
                <Input value={form.registrationNumber} onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label>Direct phone (admin only)</Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Label>Areas of expertise</Label>
              {form.areasOfExpertise.map((ex, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={ex}
                    onChange={(e) => {
                      const next = [...form.areasOfExpertise];
                      next[i] = e.target.value;
                      setForm((f) => ({ ...f, areasOfExpertise: next }));
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        areasOfExpertise: f.areasOfExpertise.filter((_, j) => j !== i),
                      }))
                    }
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setForm((f) => ({ ...f, areasOfExpertise: [...f.areasOfExpertise, ""] }))}
              >
                + Add expertise
              </Button>
            </div>

            <div className="mt-8">
              <Label>Consultation availability</Label>
              <div className="mt-3 space-y-2">
                {WEEKDAY_KEYS.map((key) => {
                  const day = form.weeklySchedule[key];
                  return (
                    <div key={key} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 p-3 text-sm">
                      <label className="flex w-28 items-center gap-2 capitalize">
                        <input
                          type="checkbox"
                          checked={day.enabled}
                          onChange={(e) => setDay(key, { enabled: e.target.checked })}
                        />
                        {key}
                      </label>
                      {day.enabled ? (
                        <>
                          <Input
                            type="time"
                            className="w-32"
                            value={day.start}
                            onChange={(e) => setDay(key, { start: e.target.value })}
                          />
                          <span>–</span>
                          <Input
                            type="time"
                            className="w-32"
                            value={day.end}
                            onChange={(e) => setDay(key, { end: e.target.value })}
                          />
                        </>
                      ) : (
                        <span className="text-slate-500">Closed</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
                Featured doctor
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
                Published
              </label>
            </div>

            <div className="mt-8 flex gap-3">
              <Button type="button" onClick={() => void save()} disabled={saving || !form.name || !form.image || !form.bio}>
                {saving ? "Saving…" : "Save profile"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
