"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState } from "@/components/admin/loading-state";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import { GALLERY_CATEGORIES, isPatientRelatedCategory } from "@/lib/gallery-categories";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

type MediaRecord = {
  id: string;
  title: string;
  description: string | null;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  category: string;
  isPublic: boolean;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
};

const emptyForm = {
  title: "",
  description: "",
  mediaType: "IMAGE" as const,
  mediaUrl: "",
  category: "clinic" as const,
  isPublic: false,
  status: "DRAFT" as const,
};

type Props = {
  defaultMediaType?: "IMAGE" | "VIDEO" | "ALL";
};

export function GalleryView({ defaultMediaType = "ALL" }: Props) {
  const [items, setItems] = useState<MediaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<MediaRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ items: MediaRecord[] }>("/api/admin/media?limit=200");
      let list = data.items ?? [];
      if (defaultMediaType === "IMAGE") list = list.filter((m) => m.mediaType === "IMAGE");
      if (defaultMediaType === "VIDEO") list = list.filter((m) => m.mediaType === "VIDEO");
      setItems(list);
    } catch {
      setError("Could not load gallery.");
    } finally {
      setLoading(false);
    }
  }, [defaultMediaType]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = (type: "IMAGE" | "VIDEO") => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      mediaType: type,
      category: type === "VIDEO" ? "videos" : "clinic",
    });
    setFormOpen(true);
    setMessage(null);
  };

  const openEdit = (m: MediaRecord) => {
    setEditingId(m.id);
    setForm({
      title: m.title,
      description: m.description ?? "",
      mediaType: m.mediaType,
      mediaUrl: m.mediaUrl,
      category: m.category as typeof emptyForm.category,
      isPublic: m.isPublic,
      status: m.status,
    });
    setFormOpen(true);
    setMessage(null);
  };

  const onCategoryChange = (category: typeof form.category) => {
    const next = { ...form, category };
    if (isPatientRelatedCategory(category) && form.isPublic) {
      const ok = confirm(
        "Patient-related media must not go public without consent. Turn off Public for this item?",
      );
      if (ok) next.isPublic = false;
    }
    setForm(next);
  };

  const onPublicChange = (checked: boolean) => {
    if (checked && isPatientRelatedCategory(form.category)) {
      const ok = confirm(
        "Confirm: you have permission to show this patient photo/video on the public website.",
      );
      if (!ok) return;
    }
    setForm({ ...form, isPublic: checked });
  };

  const save = async () => {
    if (!form.mediaUrl) {
      setMessage("Upload a file first.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...form,
        description: form.description || "",
      };
      if (editingId) {
        await adminFetch(`/api/admin/media/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setMessage("Gallery item updated.");
      } else {
        await adminFetch("/api/admin/media", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Gallery item created.");
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (m: MediaRecord) => {
    const status = m.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    if (status === "PUBLISHED" && m.isPublic && isPatientRelatedCategory(m.category)) {
      if (!confirm("Publish this patient-related item on the website?")) return;
    }
    await adminFetch(`/api/admin/media/${m.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  };

  const onDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await adminFetch(`/api/admin/media/${id}`, { method: "DELETE" });
    await load();
  };

  if (loading) return <LoadingState />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-slate-500">
          Upload clinic and treatment media. Patient photos/videos stay private until you check{" "}
          <strong>Public ✓</strong> and publish.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => openCreate("IMAGE")}>
            <Plus className="h-4 w-4" />
            Upload image
          </Button>
          <Button type="button" variant="secondary" onClick={() => openCreate("VIDEO")}>
            <Plus className="h-4 w-4" />
            Upload video
          </Button>
        </div>
      </div>

      {message && (
        <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
          {message}
        </p>
      )}

      {formOpen && (
        <div className="card-premium space-y-4 p-6">
          <h3 className="text-lg font-semibold">{editingId ? "Edit media" : "New gallery item"}</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Media type *</Label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.mediaType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    mediaType: e.target.value as "IMAGE" | "VIDEO",
                    category: e.target.value === "VIDEO" ? "videos" : form.category,
                  })
                }
              >
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
              </select>
            </div>
            <div>
              <Label>Category *</Label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) => onCategoryChange(e.target.value as typeof form.category)}
              >
                {GALLERY_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <MediaUploadField
            mediaType={form.mediaType}
            folder="gallery"
            value={form.mediaUrl || null}
            onChange={(url) => setForm({ ...form, mediaUrl: url })}
          />

          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.status === "PUBLISHED"}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.checked ? "PUBLISHED" : "DRAFT" })
                }
              />
              Publish status ✓
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => onPublicChange(e.target.checked)}
              />
              Public on website ✓
            </label>
          </div>
          {isPatientRelatedCategory(form.category) && (
            <p className="text-xs text-amber-800">
              Privacy: patient-related items require explicit Public ✓ before appearing on the site.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Save media"}
            </Button>
            {form.mediaUrl && (
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setPreview({
                    id: "preview",
                    title: form.title || "Preview",
                    description: form.description || null,
                    mediaType: form.mediaType,
                    mediaUrl: form.mediaUrl,
                    category: form.category,
                    isPublic: form.isPublic,
                    status: form.status,
                    createdAt: new Date().toISOString(),
                  })
                }
              >
                Preview
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-lg rounded-2xl bg-white p-4">
            {preview.mediaType === "VIDEO" ? (
              <video src={preview.mediaUrl} controls className="w-full rounded-xl" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.mediaUrl} alt="" className="w-full rounded-xl" />
            )}
            <p className="mt-3 font-semibold">{preview.title}</p>
            <Button type="button" className="mt-4 w-full" variant="ghost" onClick={() => setPreview(null)}>
              Close preview
            </Button>
          </div>
        </div>
      )}

      <DataTable
        headers={["Preview", "Title", "Category", "Type", "Uploaded", "Public", "Status", "Actions"]}
        empty={items.length === 0}
      >
        {items.map((m) => (
          <tr key={m.id}>
            <td className="px-4 py-3">
              {m.mediaType === "VIDEO" ? (
                <video src={m.mediaUrl} className="h-12 w-16 rounded object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.mediaUrl} alt="" className="h-12 w-12 rounded object-cover" />
              )}
            </td>
            <td className="px-4 py-3 font-medium">{m.title}</td>
            <td className="px-4 py-3 text-xs">{m.category}</td>
            <td className="px-4 py-3">{m.mediaType}</td>
            <td className="px-4 py-3 text-xs text-slate-500">
              {format(new Date(m.createdAt), "MMM d, yyyy")}
            </td>
            <td className="px-4 py-3">{m.isPublic ? "Yes" : "No"}</td>
            <td className="px-4 py-3">{m.status}</td>
            <td className="px-4 py-3">
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setPreview(m)} title="Preview">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(m)} title="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => togglePublish(m)} title="Publish">
                  {m.status === "PUBLISHED" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(m.id, m.title)}
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
