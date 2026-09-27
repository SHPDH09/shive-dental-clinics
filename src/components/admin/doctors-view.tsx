"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState } from "@/components/admin/loading-state";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Pencil, Plus, Trash2 } from "lucide-react";

export type DoctorRecord = {
  id: string;
  name: string;
  qualification: string;
  specialization: string;
  experienceYears: number;
  bio: string;
  summary: string | null;
  registrationNumber: string | null;
  phone: string | null;
  image: string | null;
  consultationHours: string | null;
  featured: boolean;
  enabled: boolean;
  sortOrder: number;
};

const emptyForm: Omit<DoctorRecord, "id"> = {
  name: "",
  qualification: "",
  specialization: "",
  experienceYears: 5,
  bio: "",
  summary: "",
  registrationNumber: "",
  phone: "",
  image: "",
  consultationHours: "",
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
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ items: DoctorRecord[] }>("/api/admin/doctors?limit=100");
      setItems(data.items ?? []);
    } catch {
      setError("Could not load doctors.");
    } finally {
      setLoading(false);
    }
  }, []);

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
    setForm({
      name: d.name,
      qualification: d.qualification,
      specialization: d.specialization,
      experienceYears: d.experienceYears,
      bio: d.bio,
      summary: d.summary ?? "",
      registrationNumber: d.registrationNumber ?? "",
      phone: d.phone ?? "",
      image: d.image ?? "",
      consultationHours: d.consultationHours ?? "",
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
    const payload = {
      ...form,
      experienceYears: Number(form.experienceYears) || 0,
      summary: form.summary || null,
      registrationNumber: form.registrationNumber || null,
      phone: form.phone || null,
      image: form.image || null,
      consultationHours: form.consultationHours || null,
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
      setMessage("Save failed. Check all required fields.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this doctor profile?")) return;
    try {
      await adminFetch(`/api/admin/doctors/${id}`, { method: "DELETE" });
      await load();
    } catch {
      setMessage("Delete failed.");
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Add doctor details and photo — featured profile shows prominently on the homepage.
        </p>
        <Button type="button" onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add doctor profile
        </Button>
      </div>

      {formOpen && (
        <div className="card-premium space-y-5 p-6">
          <h3 className="text-lg font-bold text-slate-900">
            {editingId ? "Edit doctor profile" : "New doctor profile"}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Full name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Rishikesh Prasad" />
            </div>
            <div>
              <Label>Specialization *</Label>
              <Input
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                placeholder="Oral & Dental Surgeon"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Qualifications *</Label>
              <Input
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                placeholder="B.D.S. (Hons), M.Sc (Microbiology), MIDA, C.C.C.M."
              />
            </div>
            <div>
              <Label>Registration number</Label>
              <Input
                value={form.registrationNumber ?? ""}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                placeholder="XX84/A/2017"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9973479904" />
            </div>
            <div>
              <Label>Experience (years) *</Label>
              <Input
                type="number"
                min={0}
                value={form.experienceYears}
                onChange={(e) => setForm({ ...form, experienceYears: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
            <div>
              <Label>Consultation hours</Label>
              <Input
                value={form.consultationHours ?? ""}
                onChange={(e) => setForm({ ...form, consultationHours: e.target.value })}
                placeholder="Mon – Sat: 10 AM – 6 PM"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Homepage summary (short)</Label>
              <Textarea
                rows={2}
                value={form.summary ?? ""}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="2–3 lines shown on the homepage featured section"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Full bio *</Label>
              <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <ImageUploadField label="Doctor photo" folder="doctors" value={form.image || null} onChange={(url) => setForm({ ...form, image: url })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              Show as featured doctor on homepage
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
              Visible on website
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={save} disabled={saving || !form.name || !form.bio}>
              {saving ? "Saving…" : "Save profile"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {message && <p className="text-sm text-teal-700">{message}</p>}

      <DataTable
        headers={["Photo", "Name", "Specialization", "Featured", "Active", "Actions"]}
        empty={items.length === 0}
      >
        {items.map((d) => (
          <tr key={d.id}>
            <td className="px-4 py-3">
              {d.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </td>
            <td className="px-4 py-3 font-medium">{d.name}</td>
            <td className="px-4 py-3">{d.specialization}</td>
            <td className="px-4 py-3">{d.featured ? "Yes" : "No"}</td>
            <td className="px-4 py-3">{d.enabled ? "Yes" : "No"}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <button type="button" className="rounded p-1 hover:bg-slate-100" onClick={() => openEdit(d)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" className="rounded p-1 text-red-600 hover:bg-red-50" onClick={() => remove(d.id)} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
