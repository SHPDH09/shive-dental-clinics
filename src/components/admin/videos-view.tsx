"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { DataTable } from "@/components/admin/data-table";
import { DataLoadingSection } from "@/components/admin/loading-state";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { VideoUploadField } from "@/components/admin/video-upload-field";
import { StatCard } from "@/components/admin/stat-card";
import {
  VIDEO_CATEGORIES,
  isPatientVideoCategory,
  videoCategoryLabel,
  type VideoCategoryId,
} from "@/lib/video-categories";
import { formatDuration } from "@/lib/public-video-types";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Eye, EyeOff, Film, Lock, Pencil, Play, Plus, Trash2, Video } from "lucide-react";
import { format } from "date-fns";

type VideoRecord = {
  id: string;
  title: string;
  description: string | null;
  mediaUrl: string;
  thumbnailUrl: string | null;
  category: string;
  durationSeconds: number | null;
  viewCount: number;
  isPublic: boolean;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
};

type VideoStats = {
  total: number;
  published: number;
  drafts: number;
  private: number;
  totalViews: number;
};

type VideoForm = {
  title: string;
  description: string;
  mediaUrl: string;
  thumbnailUrl: string;
  category: VideoCategoryId;
  durationSeconds: number;
  uploadDate: string;
  isPublic: boolean;
  status: "DRAFT" | "PUBLISHED";
};

const emptyForm: VideoForm = {
  title: "",
  description: "",
  mediaUrl: "",
  thumbnailUrl: "",
  category: "dental-treatments",
  durationSeconds: 0,
  uploadDate: new Date().toISOString().slice(0, 10),
  isPublic: false,
  status: "DRAFT",
};

export function VideosView() {
  const [items, setItems] = useState<VideoRecord[]>([]);
  const [stats, setStats] = useState<VideoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<VideoRecord | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search.trim()) params.set("q", search.trim());
      if (filterCategory) params.set("category", filterCategory);
      if (filterStatus) params.set("status", filterStatus);

      const [list, st] = await Promise.all([
        adminFetch<{ items: VideoRecord[] }>(`/api/admin/videos?${params}`),
        adminFetch<VideoStats>("/api/admin/videos/stats"),
      ]);
      setItems(list.items ?? []);
      setStats(st);
    } catch {
      setError("Could not load videos.");
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, filterStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
    setMessage(null);
  };

  const openEdit = (v: VideoRecord) => {
    setEditingId(v.id);
    setForm({
      title: v.title,
      description: v.description ?? "",
      mediaUrl: v.mediaUrl,
      thumbnailUrl: v.thumbnailUrl ?? "",
      category: v.category as VideoCategoryId,
      durationSeconds: v.durationSeconds ?? 0,
      uploadDate: v.createdAt.slice(0, 10),
      isPublic: v.isPublic,
      status: v.status,
    });
    setFormOpen(true);
    setMessage(null);
  };

  const onPublicChange = (isPublic: boolean) => {
    if (isPublic && isPatientVideoCategory(form.category)) {
      if (!confirm("Confirm patient consent to show this video publicly on the website.")) return;
    }
    setForm({ ...form, isPublic });
  };

  const save = async () => {
    if (!form.mediaUrl || !form.thumbnailUrl) {
      setMessage("Video file and thumbnail are required.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        mediaUrl: form.mediaUrl,
        thumbnailUrl: form.thumbnailUrl,
        category: form.category,
        durationSeconds: form.durationSeconds || undefined,
        uploadDate: form.uploadDate,
        isPublic: form.isPublic,
        status: form.status,
      };
      if (editingId) {
        await adminFetch(`/api/admin/videos/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setMessage("Video updated.");
      } else {
        await adminFetch("/api/admin/videos", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Video uploaded.");
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (v: VideoRecord) => {
    const status = v.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await adminFetch(`/api/admin/videos/${v.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  };

  const onDelete = async (id: string, title: string) => {
    if (!confirm(`Delete video "${title}"?`)) return;
    await adminFetch(`/api/admin/videos/${id}`, { method: "DELETE" });
    await load();
  };

  if (error && !loading) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <DataLoadingSection loading={loading} label="Loading videos…" minHeight="min-h-[50vh]">
    <div className="space-y-6">
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total videos" value={stats.total} icon={Video} />
          <StatCard label="Published" value={stats.published} icon={Eye} />
          <StatCard label="Drafts" value={stats.drafts} icon={Film} />
          <StatCard label="Private" value={stats.private} icon={Lock} />
          <StatCard label="Total views" value={stats.totalViews} icon={Play} />
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search videos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {VIDEO_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
          <Button type="button" variant="secondary" size="sm" onClick={() => void load()}>
            Apply
          </Button>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Upload video
        </Button>
      </div>

      <p className="text-sm text-slate-500">
        Patient videos stay <strong>Private</strong> until you choose Public and Publish. MP4, WEBM, MOV
        supported.
      </p>

      {message && (
        <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
          {message}
        </p>
      )}

      {formOpen && (
        <div className="card-premium space-y-4 p-6">
          <h3 className="text-lg font-semibold">{editingId ? "Edit video" : "Upload video"}</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Video title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Category *</Label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as typeof form.category })
                }
              >
                {VIDEO_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Upload date</Label>
              <Input
                type="date"
                value={form.uploadDate}
                onChange={(e) => setForm({ ...form, uploadDate: e.target.value })}
              />
            </div>
          </div>

          <VideoUploadField
            videoUrl={form.mediaUrl || null}
            onVideoUrl={(url) => setForm({ ...form, mediaUrl: url })}
            onDuration={(seconds) => setForm({ ...form, durationSeconds: seconds })}
          />

          <ImageUploadField
            label="Thumbnail *"
            folder="video-thumbnails"
            value={form.thumbnailUrl || null}
            onChange={(url) => setForm({ ...form, thumbnailUrl: url })}
          />

          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-800">Visibility</p>
            <div className="flex flex-wrap gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="visibility"
                  checked={!form.isPublic}
                  onChange={() => onPublicChange(false)}
                />
                ○ Private
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="visibility"
                  checked={form.isPublic}
                  onChange={() => onPublicChange(true)}
                />
                ● Public
              </label>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.status === "PUBLISHED"}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.checked ? "PUBLISHED" : "DRAFT" })
                }
              />
              Publish status *
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Save video"}
            </Button>
            {form.mediaUrl && (
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setPreview({
                    id: "preview",
                    title: form.title,
                    description: form.description || null,
                    mediaUrl: form.mediaUrl,
                    thumbnailUrl: form.thumbnailUrl,
                    category: form.category,
                    durationSeconds: form.durationSeconds,
                    viewCount: 0,
                    isPublic: form.isPublic,
                    status: form.status,
                    createdAt: form.uploadDate,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-4">
            <video src={preview.mediaUrl} controls autoPlay className="w-full rounded-xl" />
            <p className="mt-3 font-semibold">{preview.title}</p>
            <Button type="button" className="mt-4 w-full" variant="ghost" onClick={() => setPreview(null)}>
              Close
            </Button>
          </div>
        </div>
      )}

      <DataTable
        headers={["Thumb", "Title", "Category", "Duration", "Views", "Date", "Public", "Status", "Actions"]}
        empty={items.length === 0}
      >
        {items.map((v) => (
          <tr key={v.id}>
            <td className="px-4 py-3">
              {v.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnailUrl} alt="" className="h-12 w-20 rounded object-cover" />
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </td>
            <td className="max-w-[180px] truncate px-4 py-3 font-medium">{v.title}</td>
            <td className="px-4 py-3 text-xs">{videoCategoryLabel(v.category)}</td>
            <td className="px-4 py-3 text-xs">{formatDuration(v.durationSeconds)}</td>
            <td className="px-4 py-3">{v.viewCount}</td>
            <td className="px-4 py-3 text-xs">{format(new Date(v.createdAt), "MMM d, yyyy")}</td>
            <td className="px-4 py-3">{v.isPublic ? "Public" : "Private"}</td>
            <td className="px-4 py-3">{v.status}</td>
            <td className="px-4 py-3">
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setPreview(v)}>
                  <Play className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(v)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => togglePublish(v)}>
                  {v.status === "PUBLISHED" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(v.id, v.title)}>
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
