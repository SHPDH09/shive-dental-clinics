"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { DataTable } from "@/components/admin/data-table";
import { DataLoadingSection } from "@/components/admin/loading-state";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { BeforeAfterSlider } from "@/components/public/before-after-slider";
import { TRANSFORMATION_CATEGORIES, transformationCategoryLabel } from "@/lib/transformation-categories";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { format } from "date-fns";

type CaseRecord = {
  id: string;
  caseName: string;
  treatment: string;
  category: string;
  beforeImage: string;
  afterImage: string;
  description: string | null;
  treatmentDuration: string | null;
  caseDate: string;
  verifiedCase: boolean;
  consentConfirmed: boolean;
  isPublic: boolean;
  featured: boolean;
  status: "DRAFT" | "PUBLISHED";
  sortOrder: number;
};

type CaseForm = {
  caseName: string;
  treatment: string;
  category: (typeof TRANSFORMATION_CATEGORIES)[number]["id"];
  beforeImage: string;
  afterImage: string;
  description: string;
  treatmentDuration: string;
  caseDate: string;
  verifiedCase: boolean;
  consentConfirmed: boolean;
  isPublic: boolean;
  featured: boolean;
  status: "DRAFT" | "PUBLISHED";
  sortOrder: number;
};

const emptyForm: CaseForm = {
  caseName: "",
  treatment: "",
  category: "cosmetic-dentistry",
  beforeImage: "",
  afterImage: "",
  description: "",
  treatmentDuration: "",
  caseDate: new Date().toISOString().slice(0, 10),
  verifiedCase: true,
  consentConfirmed: false,
  isPublic: false,
  featured: false,
  status: "DRAFT",
  sortOrder: 0,
};

export function BeforeAfterView() {
  const [items, setItems] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CaseForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ items: CaseRecord[] }>("/api/admin/before-after?limit=100");
      setItems(data.items ?? []);
    } catch {
      setError("Could not load transformations.");
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

  const openEdit = (c: CaseRecord) => {
    setEditingId(c.id);
    setForm({
      caseName: c.caseName,
      treatment: c.treatment,
      category: c.category as CaseForm["category"],
      beforeImage: c.beforeImage,
      afterImage: c.afterImage,
      description: c.description ?? "",
      treatmentDuration: c.treatmentDuration ?? "",
      caseDate: c.caseDate.slice(0, 10),
      verifiedCase: c.verifiedCase,
      consentConfirmed: c.consentConfirmed,
      isPublic: c.isPublic,
      featured: c.featured,
      status: c.status,
      sortOrder: c.sortOrder,
    });
    setFormOpen(true);
    setMessage(null);
  };

  const save = async () => {
    if (!form.beforeImage || !form.afterImage) {
      setMessage("Before and after images are required.");
      return;
    }
    if (form.isPublic && form.status === "PUBLISHED" && !form.consentConfirmed) {
      setMessage("Check patient consent before public publish.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const payload = { ...form };
      if (editingId) {
        await adminFetch(`/api/admin/before-after/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setMessage("Case updated.");
      } else {
        await adminFetch("/api/admin/before-after", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Case added.");
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (c: CaseRecord) => {
    const status = c.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    if (status === "PUBLISHED" && c.isPublic && !c.consentConfirmed) {
      alert("Enable consent before publishing publicly.");
      return;
    }
    await adminFetch(`/api/admin/before-after/${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  };

  const onDelete = async (id: string, name: string) => {
    if (!confirm(`Delete case "${name}"?`)) return;
    await adminFetch(`/api/admin/before-after/${id}`, { method: "DELETE" });
    await load();
  };

  if (error && !loading) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <DataLoadingSection loading={loading} label="Loading transformations…" minHeight="min-h-[50vh]">
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-slate-500">
          Case names stay in admin only. Website shows treatment + images — never auto-public without
          consent.
        </p>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add transformation
        </Button>
      </div>

      {message && (
        <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
          {message}
        </p>
      )}

      {formOpen && (
        <div className="card-premium space-y-4 p-6">
          <h3 className="text-lg font-semibold">{editingId ? "Edit case" : "New transformation"}</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Patient / case name * (admin only)</Label>
              <Input
                value={form.caseName}
                onChange={(e) => setForm({ ...form, caseName: e.target.value })}
              />
            </div>
            <div>
              <Label>Treatment *</Label>
              <Input
                value={form.treatment}
                onChange={(e) => setForm({ ...form, treatment: e.target.value })}
              />
            </div>
            <div>
              <Label>Category *</Label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as CaseForm["category"] })
                }
              >
                {TRANSFORMATION_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Treatment duration</Label>
              <Input
                placeholder="e.g. 3 weeks"
                value={form.treatmentDuration}
                onChange={(e) => setForm({ ...form, treatmentDuration: e.target.value })}
              />
            </div>
            <div>
              <Label>Case date</Label>
              <Input
                type="date"
                value={form.caseDate}
                onChange={(e) => setForm({ ...form, caseDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Sort order (homepage)</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ImageUploadField
              label="Before image *"
              folder="before-after"
              value={form.beforeImage || null}
              onChange={(url) => setForm({ ...form, beforeImage: url })}
            />
            <ImageUploadField
              label="After image *"
              folder="before-after"
              value={form.afterImage || null}
              onChange={(url) => setForm({ ...form, afterImage: url })}
            />
          </div>

          {form.beforeImage && form.afterImage && (
            <div>
              <Label>Preview slider</Label>
              <BeforeAfterSlider beforeSrc={form.beforeImage} afterSrc={form.afterImage} />
            </div>
          )}

          <div>
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.consentConfirmed}
                onChange={(e) => setForm({ ...form, consentConfirmed: e.target.checked })}
              />
              Patient consent for public display — Confirmed
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="vis"
                checked={!form.isPublic}
                onChange={() => setForm({ ...form, isPublic: false })}
              />
              Private (keep off website)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="vis"
                checked={form.isPublic}
                onChange={() => setForm({ ...form, isPublic: true })}
              />
              Public (may show when published + consent)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.verifiedCase}
                onChange={(e) => setForm({ ...form, verifiedCase: e.target.checked })}
              />
              Verified case ✓
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              Featured on homepage
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.status === "PUBLISHED"}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.checked ? "PUBLISHED" : "DRAFT" })
                }
              />
              Publish status
            </label>
          </div>

          <div className="flex gap-2">
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save case"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <DataTable
        headers={["Treatment", "Category", "Consent", "Public", "Featured", "Status", "Actions"]}
        empty={items.length === 0}
      >
        {items.map((c) => (
          <tr key={c.id}>
            <td className="px-4 py-3">
              <p className="font-medium">{c.treatment}</p>
              <p className="text-xs text-slate-400">{c.caseName}</p>
            </td>
            <td className="px-4 py-3 text-xs">{transformationCategoryLabel(c.category)}</td>
            <td className="px-4 py-3">{c.consentConfirmed ? "Yes" : "No"}</td>
            <td className="px-4 py-3">{c.isPublic ? "Public" : "Private"}</td>
            <td className="px-4 py-3">{c.featured ? <Star className="h-4 w-4 text-amber-500" /> : "—"}</td>
            <td className="px-4 py-3">{c.status}</td>
            <td className="px-4 py-3">
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(c)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => togglePublish(c)}>
                  {c.status === "PUBLISHED" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(c.id, c.caseName)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
    </DataLoadingSection>
  );
}
