"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState } from "@/components/admin/loading-state";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from "lucide-react";

type TestimonialRecord = {
  id: string;
  patientName: string;
  patientImage: string | null;
  rating: number;
  treatment: string | null;
  testimonial: string;
  testimonialDate: string;
  verifiedPatient: boolean;
  status: "DRAFT" | "PUBLISHED";
};

type ServiceOption = { name: string };

type TestimonialForm = {
  patientName: string;
  patientImage: string;
  rating: number;
  treatment: string;
  testimonial: string;
  testimonialDate: string;
  verifiedPatient: boolean;
  status: "DRAFT" | "PUBLISHED";
};

const emptyForm: TestimonialForm = {
  patientName: "",
  patientImage: "",
  rating: 5,
  treatment: "",
  testimonial: "",
  testimonialDate: new Date().toISOString().slice(0, 10),
  verifiedPatient: true,
  status: "PUBLISHED",
};

export function TestimonialsView() {
  const [items, setItems] = useState<TestimonialRecord[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
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
      const [list, svc] = await Promise.all([
        adminFetch<{ items: TestimonialRecord[] }>("/api/admin/testimonials?limit=100"),
        adminFetch<{ items: ServiceOption[] }>("/api/admin/services?limit=100").catch(() => ({
          items: [] as ServiceOption[],
        })),
      ]);
      setItems(list.items ?? []);
      setServices(svc.items ?? []);
    } catch {
      setError("Could not load testimonials.");
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

  const openEdit = (t: TestimonialRecord) => {
    setEditingId(t.id);
    setForm({
      patientName: t.patientName,
      patientImage: t.patientImage ?? "",
      rating: t.rating,
      treatment: t.treatment ?? "",
      testimonial: t.testimonial,
      testimonialDate: t.testimonialDate.slice(0, 10),
      verifiedPatient: t.verifiedPatient ?? true,
      status: t.status,
    });
    setFormOpen(true);
    setMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = { ...form, patientImage: form.patientImage || "" };
      if (editingId) {
        await adminFetch(`/api/admin/testimonials/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setMessage("Testimonial updated.");
      } else {
        await adminFetch("/api/admin/testimonials", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Testimonial created.");
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (t: TestimonialRecord) => {
    const status = t.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await adminFetch(`/api/admin/testimonials/${t.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  };

  const onDelete = async (id: string, name: string) => {
    if (!confirm(`Delete testimonial from ${name}?`)) return;
    await adminFetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    await load();
  };

  if (loading) return <LoadingState />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Manage patient stories on the homepage carousel and testimonials page.
        </p>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add testimonial
        </Button>
      </div>

      {message && (
        <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
          {message}
        </p>
      )}

      {formOpen && (
        <div className="card-premium space-y-4 p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            {editingId ? "Edit testimonial" : "New testimonial"}
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Patient name *</Label>
              <Input
                value={form.patientName}
                onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                placeholder="Priya Sharma"
              />
            </div>
            <div>
              <Label>Treatment *</Label>
              <Input
                list="treatment-options"
                value={form.treatment}
                onChange={(e) => setForm({ ...form, treatment: e.target.value })}
                placeholder="Root Canal Treatment"
              />
              <datalist id="treatment-options">
                {services.map((s) => (
                  <option key={s.name} value={s.name} />
                ))}
              </datalist>
            </div>
            <div>
              <Label>Rating * (1–5)</Label>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm({ ...form, rating: n })}
                    className="rounded p-1 hover:bg-amber-50"
                    aria-label={`${n} stars`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        n <= form.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={form.testimonialDate}
                onChange={(e) => setForm({ ...form, testimonialDate: e.target.value })}
              />
            </div>
          </div>

          <ImageUploadField
            label="Patient image"
            folder="testimonials"
            value={form.patientImage || null}
            onChange={(url) => setForm({ ...form, patientImage: url })}
          />

          <div>
            <Label>Testimonial *</Label>
            <Textarea
              rows={4}
              value={form.testimonial}
              onChange={(e) => setForm({ ...form, testimonial: e.target.value })}
              placeholder="Very professional treatment and friendly staff..."
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.verifiedPatient}
                onChange={(e) => setForm({ ...form, verifiedPatient: e.target.checked })}
                className="rounded border-slate-300"
              />
              Verified patient ✓
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.status === "PUBLISHED"}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.checked ? "PUBLISHED" : "DRAFT" })
                }
                className="rounded border-slate-300"
              />
              Publish on website ✓
            </label>
          </div>

          <div className="flex gap-2">
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create testimonial"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <DataTable
        headers={["Patient", "Rating", "Treatment", "Status", "Verified", "Actions"]}
        empty={items.length === 0}
      >
        {items.map((t) => (
          <tr key={t.id}>
            <td className="px-4 py-3 font-medium">{t.patientName}</td>
            <td className="px-4 py-3">{t.rating}/5</td>
            <td className="px-4 py-3">{t.treatment ?? "—"}</td>
            <td className="px-4 py-3">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  t.status === "PUBLISHED"
                    ? "bg-teal-100 text-teal-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {t.status}
              </span>
            </td>
            <td className="px-4 py-3">{t.verifiedPatient ? "Yes" : "No"}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(t)} title="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePublish(t)}
                  title={t.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                >
                  {t.status === "PUBLISHED" ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(t.id, t.patientName)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
