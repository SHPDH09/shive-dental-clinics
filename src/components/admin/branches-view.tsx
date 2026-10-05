"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AdminApiError, adminFetch } from "@/lib/admin-client";
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

type BranchRecord = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  address: string;
  city: string;
  phone: string;
  whatsapp: string | null;
  openTime: string;
  closeTime: string;
  offDays: string | null;
  weeklySchedule: WeeklySchedule | unknown;
  doctorIds: string[] | unknown;
  serviceIds: string[] | unknown;
  featured: boolean;
  published: boolean;
  status: "ACTIVE" | "CLOSED";
  sortOrder: number;
};

type BranchForm = {
  name: string;
  slug: string;
  image: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  whatsapp: string;
  mapUrl: string;
  mapEmbedUrl: string;
  latitude: string;
  longitude: string;
  weeklySchedule: WeeklySchedule;
  doctorIds: string[];
  serviceIds: string[];
  featured: boolean;
  published: boolean;
  status: "ACTIVE" | "CLOSED";
  sortOrder: number;
};

type PickOption = { id: string; name: string };

function asIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

const emptyForm: BranchForm = {
  name: "",
  slug: "",
  image: "",
  address: "",
  city: "",
  state: "",
  pinCode: "",
  phone: "",
  whatsapp: "",
  mapUrl: "",
  mapEmbedUrl: "",
  latitude: "",
  longitude: "",
  weeklySchedule: {
    ...DEFAULT_WEEKLY_SCHEDULE,
    monday: { enabled: true, start: "10:00", end: "19:00" },
    tuesday: { enabled: true, start: "10:00", end: "19:00" },
    wednesday: { enabled: true, start: "10:00", end: "19:00" },
    thursday: { enabled: true, start: "10:00", end: "19:00" },
    friday: { enabled: true, start: "10:00", end: "19:00" },
    saturday: { enabled: true, start: "10:00", end: "19:00" },
    sunday: { enabled: false, start: "10:00", end: "14:00" },
  },
  doctorIds: [],
  serviceIds: [],
  featured: false,
  published: true,
  status: "ACTIVE",
  sortOrder: 0,
};

export function BranchesView() {
  const [items, setItems] = useState<BranchRecord[]>([]);
  const [doctors, setDoctors] = useState<PickOption[]>([]);
  const [services, setServices] = useState<PickOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterPublished, setFilterPublished] = useState<"" | "true" | "false">("");
  const [sort, setSort] = useState<"newest" | "name" | "city">("newest");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100", sort });
      if (search.trim()) params.set("q", search.trim());
      if (filterCity.trim()) params.set("city", filterCity.trim());
      if (filterPublished) params.set("published", filterPublished);
      const data = await adminFetch<{ items: BranchRecord[] }>(`/api/admin/branches?${params}`);
      setItems(data.items ?? []);
    } catch {
      setError("Could not load branches.");
    } finally {
      setLoading(false);
    }
  }, [search, filterCity, filterPublished, sort]);

  useEffect(() => {
    void load();
    void Promise.all([
      adminFetch<{ items: PickOption[] }>("/api/admin/doctors?limit=100"),
      adminFetch<{ items: PickOption[] }>("/api/admin/services?limit=100"),
    ]).then(([d, s]) => {
      setDoctors(d.items ?? []);
      setServices(s.items ?? []);
    });
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
    setMessage(null);
  };

  const openEdit = (b: BranchRecord) => {
    setEditingId(b.id);
    setForm({
      name: b.name,
      slug: b.slug,
      image: b.image ?? "",
      address: b.address,
      city: b.city,
      state: "",
      pinCode: "",
      phone: b.phone,
      whatsapp: b.whatsapp ?? b.phone,
      mapUrl: "",
      mapEmbedUrl: "",
      latitude: "",
      longitude: "",
      weeklySchedule: parseWeeklySchedule(b.weeklySchedule),
      doctorIds: asIds(b.doctorIds),
      serviceIds: asIds(b.serviceIds),
      featured: b.featured,
      published: b.published,
      status: b.status,
      sortOrder: b.sortOrder,
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
      openTime: formatConsultationSummary(schedule).slice(0, 40) || "10:00 AM",
      closeTime: "7:00 PM",
      whatsapp: form.whatsapp || form.phone,
    };
    try {
      if (editingId) {
        await adminFetch(`/api/admin/branches/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
        setMessage("Branch updated.");
      } else {
        await adminFetch("/api/admin/branches", { method: "POST", body: JSON.stringify(payload) });
        setMessage("Branch added.");
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setMessage(
        e instanceof AdminApiError ? e.message : "Save failed. Check required fields.",
      );
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (b: BranchRecord) => {
    await adminFetch(`/api/admin/branches/${b.id}`, {
      method: "PATCH",
      body: JSON.stringify({ published: !b.published }),
    });
    await load();
  };

  const toggleFeatured = async (b: BranchRecord) => {
    await adminFetch(`/api/admin/branches/${b.id}`, {
      method: "PATCH",
      body: JSON.stringify({ featured: !b.featured }),
    });
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this branch?")) return;
    await adminFetch(`/api/admin/branches/${id}`, { method: "DELETE" });
    await load();
  };

  const setDay = (key: keyof WeeklySchedule, patch: Partial<DaySchedule>) => {
    setForm((f) => ({
      ...f,
      weeklySchedule: { ...f.weeklySchedule, [key]: { ...f.weeklySchedule[key], ...patch } },
    }));
  };

  const toggleId = (field: "doctorIds" | "serviceIds", id: string) => {
    setForm((f) => {
      const set = new Set(f[field]);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...f, [field]: [...set] };
    });
  };

  if (loading && items.length === 0) return <LoadingState />;
  if (error && items.length === 0) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-2 lg:grid-cols-4">
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Input placeholder="City filter" value={filterCity} onChange={(e) => setFilterCity(e.target.value)} />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={filterPublished}
          onChange={(e) => setFilterPublished(e.target.value as "" | "true" | "false")}
        >
          <option value="">All</option>
          <option value="true">Published</option>
          <option value="false">Unpublished</option>
        </select>
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
        >
          <option value="newest">Newest</option>
          <option value="name">Name</option>
          <option value="city">City</option>
        </select>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add branch
        </Button>
      </div>

      {message && <p className="text-sm text-teal-700">{message}</p>}

      <DataTable
        headers={["", "Branch", "City", "Phone", "Hours", "Status", "Actions"]}
        empty={items.length === 0}
      >
        {items.map((b) => (
          <tr key={b.id}>
            <td className="px-2 py-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-slate-100">
                {b.image ? (
                  <Image src={b.image} alt="" fill className="object-cover" sizes="48px" />
                ) : (
                  <span className="flex h-full items-center justify-center">📍</span>
                )}
              </div>
            </td>
            <td className="px-4 py-3 font-medium">{b.name}</td>
            <td className="px-4 py-3">{b.city}</td>
            <td className="px-4 py-3 text-sm">{b.phone}</td>
            <td className="px-4 py-3 text-xs text-slate-500">
              {b.openTime} – {b.closeTime}
            </td>
            <td className="px-4 py-3 text-sm">
              {b.published ? "Published" : "Draft"}
              {b.featured && <span className="ml-2 text-amber-600">★</span>}
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                <button type="button" className="rounded p-1 hover:bg-slate-100" onClick={() => openEdit(b)}>
                  <Pencil className="h-4 w-4" />
                </button>
                <a href={`/branches/${b.slug}`} target="_blank" rel="noopener noreferrer" className="rounded p-1 hover:bg-slate-100">
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button type="button" className="rounded p-1 hover:bg-slate-100" onClick={() => void togglePublish(b)}>
                  {b.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button type="button" className={`rounded p-1 hover:bg-slate-100 ${b.featured ? "text-amber-500" : ""}`} onClick={() => void toggleFeatured(b)}>
                  <Star className="h-4 w-4" />
                </button>
                <button type="button" className="rounded p-1 text-red-600 hover:bg-red-50" onClick={() => void remove(b.id)}>
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
            <h3 className="text-lg font-bold">{editingId ? "Edit branch" : "Add branch"}</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Branch name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))
                  }
                />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <ImageUploadField label="Branch image" folder="branches" value={form.image || null} onChange={(url) => setForm((f) => ({ ...f, image: url }))} />
              </div>
              <div className="sm:col-span-2">
                <Label>Address *</Label>
                <Textarea rows={2} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <Label>City *</Label>
                <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <Label>State</Label>
                <Input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
              </div>
              <div>
                <Label>PIN code</Label>
                <Input value={form.pinCode} onChange={(e) => setForm((f) => ({ ...f, pinCode: e.target.value }))} />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label>Google Maps URL</Label>
                <Input value={form.mapUrl} onChange={(e) => setForm((f) => ({ ...f, mapUrl: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label>Map embed URL</Label>
                <Input value={form.mapEmbedUrl} onChange={(e) => setForm((f) => ({ ...f, mapEmbedUrl: e.target.value }))} />
              </div>
              <div>
                <Label>Latitude</Label>
                <Input value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} />
              </div>
            </div>

            <div className="mt-6">
              <Label>Opening hours</Label>
              <div className="mt-2 space-y-2">
                {WEEKDAY_KEYS.map((key) => {
                  const day = form.weeklySchedule[key];
                  return (
                    <div key={key} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 p-3 text-sm capitalize">
                      <label className="flex w-28 items-center gap-2">
                        <input type="checkbox" checked={day.enabled} onChange={(e) => setDay(key, { enabled: e.target.checked })} />
                        {key}
                      </label>
                      {day.enabled ? (
                        <>
                          <Input type="time" className="w-32" value={day.start} onChange={(e) => setDay(key, { start: e.target.value })} />
                          <span>–</span>
                          <Input type="time" className="w-32" value={day.end} onChange={(e) => setDay(key, { end: e.target.value })} />
                        </>
                      ) : (
                        <span className="text-slate-500">Closed</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Available doctors</Label>
                <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-100 p-3">
                  {doctors.map((d) => (
                    <label key={d.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.doctorIds.includes(d.id)} onChange={() => toggleId("doctorIds", d.id)} />
                      {d.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Available services</Label>
                <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-100 p-3">
                  {services.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.serviceIds.includes(s.id)} onChange={() => toggleId("serviceIds", s.id)} />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
                Featured branch
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
                Published
              </label>
              <select
                className="rounded-lg border border-slate-200 px-3 py-1 text-sm"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "ACTIVE" | "CLOSED" }))}
              >
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div className="mt-8 flex gap-3">
              <Button type="button" disabled={saving || !form.name || !form.address || !form.city || !form.phone} onClick={() => void save()}>
                {saving ? "Saving…" : "Save branch"}
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
