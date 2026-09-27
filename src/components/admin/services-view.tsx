"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState } from "@/components/admin/loading-state";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { formatCurrency, slugify } from "@/lib/utils";
import { format } from "date-fns";
import {
  Eye,
  EyeOff,
  ExternalLink,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import Image from "next/image";

type Category = { id: string; name: string; slug: string; sortOrder: number };

type ServiceRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string | null;
  whatIsTreatment: string | null;
  image: string | null;
  icon: string | null;
  categoryId: string | null;
  category?: { name: string; slug: string } | null;
  treatmentDuration: string | null;
  price: string | number | null;
  hidePrice: boolean;
  benefits: string[] | unknown;
  treatmentSteps: string[] | unknown;
  faqs: { question: string; answer: string }[] | unknown;
  featured: boolean;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
};

type ServiceForm = {
  name: string;
  slug: string;
  categoryId: string;
  image: string;
  icon: string;
  shortDesc: string;
  description: string;
  whatIsTreatment: string;
  treatmentDuration: string;
  price: string;
  hidePrice: boolean;
  benefits: string[];
  treatmentSteps: string[];
  faqs: { question: string; answer: string }[];
  featured: boolean;
  enabled: boolean;
  sortOrder: number;
};

const emptyForm: ServiceForm = {
  name: "",
  slug: "",
  categoryId: "",
  image: "",
  icon: "🦷",
  shortDesc: "",
  description: "",
  whatIsTreatment: "",
  treatmentDuration: "",
  price: "",
  hidePrice: false,
  benefits: [""],
  treatmentSteps: [""],
  faqs: [{ question: "", answer: "" }],
  featured: false,
  enabled: true,
  sortOrder: 0,
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function asFaqs(value: unknown): { question: string; answer: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const q = (item as { question?: string }).question ?? "";
      const a = (item as { answer?: string }).answer ?? "";
      return { question: q, answer: a };
    })
    .filter(Boolean) as { question: string; answer: string }[];
}

export function ServicesView() {
  const [tab, setTab] = useState<"services" | "categories">("services");
  const [items, setItems] = useState<ServiceRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPublished, setFilterPublished] = useState<"" | "true" | "false">("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    const data = await adminFetch<{ items: Category[] }>("/api/admin/service-categories?limit=100");
    setCategories(data.items ?? []);
  }, []);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100", sort });
      if (search.trim()) params.set("q", search.trim());
      if (filterCategory) params.set("categoryId", filterCategory);
      if (filterPublished) params.set("enabled", filterPublished);
      const data = await adminFetch<{ items: ServiceRecord[] }>(`/api/admin/services?${params}`);
      setItems(data.items ?? []);
    } catch {
      setError("Could not load services.");
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, filterPublished, sort]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (tab === "services") void loadServices();
  }, [tab, loadServices]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
    });
    setFormOpen(true);
    setMessage(null);
  };

  const openEdit = (s: ServiceRecord) => {
    setEditingId(s.id);
    const benefits = asStringArray(s.benefits);
    const steps = asStringArray(s.treatmentSteps);
    const faqs = asFaqs(s.faqs);
    setForm({
      name: s.name,
      slug: s.slug,
      categoryId: s.categoryId ?? categories[0]?.id ?? "",
      image: s.image ?? "",
      icon: s.icon ?? "🦷",
      shortDesc: s.shortDesc ?? "",
      description: s.description,
      whatIsTreatment: s.whatIsTreatment ?? "",
      treatmentDuration: s.treatmentDuration ?? "",
      price: s.price != null ? String(s.price) : "",
      hidePrice: s.hidePrice,
      benefits: benefits.length ? benefits : [""],
      treatmentSteps: steps.length ? steps : [""],
      faqs: faqs.length ? faqs : [{ question: "", answer: "" }],
      featured: s.featured,
      enabled: s.enabled,
      sortOrder: s.sortOrder,
    });
    setFormOpen(true);
    setMessage(null);
  };

  const saveService = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...form,
        slug: form.slug.trim() || slugify(form.name),
        benefits: form.benefits.map((b) => b.trim()).filter(Boolean),
        treatmentSteps: form.treatmentSteps.map((b) => b.trim()).filter(Boolean),
        faqs: form.faqs.filter((f) => f.question.trim() && f.answer.trim()),
      };
      if (editingId) {
        await adminFetch(`/api/admin/services/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setMessage("Service updated.");
      } else {
        await adminFetch("/api/admin/services", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Service created.");
      }
      setFormOpen(false);
      await loadServices();
    } catch {
      setMessage("Could not save. Check required fields (name, image, category, descriptions).");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (s: ServiceRecord) => {
    await adminFetch(`/api/admin/services/${s.id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: !s.enabled }),
    });
    await loadServices();
  };

  const toggleFeatured = async (s: ServiceRecord) => {
    await adminFetch(`/api/admin/services/${s.id}`, {
      method: "PATCH",
      body: JSON.stringify({ featured: !s.featured }),
    });
    await loadServices();
  };

  const deleteService = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    await adminFetch(`/api/admin/services/${id}`, { method: "DELETE" });
    await loadServices();
  };

  const saveCategory = async () => {
    const name = catName.trim();
    if (!name) return;
    const slug = catSlug.trim() || slugify(name);
    if (editingCatId) {
      await adminFetch(`/api/admin/service-categories/${editingCatId}`, {
        method: "PATCH",
        body: JSON.stringify({ name, slug }),
      });
    } else {
      await adminFetch("/api/admin/service-categories", {
        method: "POST",
        body: JSON.stringify({ name, slug }),
      });
    }
    setCatName("");
    setCatSlug("");
    setEditingCatId(null);
    await loadCategories();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await adminFetch(`/api/admin/service-categories/${id}`, { method: "DELETE" });
      await loadCategories();
    } catch {
      alert("Cannot delete — services may still use this category.");
    }
  };

  if (loading && tab === "services" && items.length === 0) return <LoadingState />;
  if (error && items.length === 0) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={tab === "services" ? "primary" : "secondary"}
          onClick={() => setTab("services")}
        >
          Services
        </Button>
        <Button
          type="button"
          variant={tab === "categories" ? "primary" : "secondary"}
          onClick={() => setTab("categories")}
        >
          Categories
        </Button>
      </div>

      {tab === "categories" && (
        <div className="card-premium space-y-4 p-6">
          <h3 className="font-semibold text-slate-900">Service categories</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              placeholder="Category name"
              value={catName}
              onChange={(e) => {
                setCatName(e.target.value);
                if (!editingCatId) setCatSlug(slugify(e.target.value));
              }}
            />
            <Input placeholder="Slug" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} />
            <Button type="button" onClick={() => void saveCategory()}>
              {editingCatId ? "Update" : "Add category"}
            </Button>
          </div>
          <ul className="divide-y divide-slate-100">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3 text-sm">
                <span>
                  <strong>{c.name}</strong>{" "}
                  <span className="font-mono text-xs text-slate-400">{c.slug}</span>
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    className="text-sky-600 hover:underline"
                    onClick={() => {
                      setEditingCatId(c.id);
                      setCatName(c.name);
                      setCatSlug(c.slug);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-red-600 hover:underline"
                    onClick={() => void deleteCategory(c.id)}
                  >
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "services" && (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Select
                value={filterPublished}
                onChange={(e) => setFilterPublished(e.target.value as "" | "true" | "false")}
              >
                <option value="">Published & draft</option>
                <option value="true">Published only</option>
                <option value="false">Unpublished only</option>
              </Select>
              <Select value={sort} onChange={(e) => setSort(e.target.value as "newest" | "oldest")}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </Select>
            </div>
            <Button type="button" onClick={openCreate} className="shrink-0 gap-2">
              <Plus className="h-4 w-4" /> Add service
            </Button>
          </div>

          {message && <p className="text-sm text-teal-700">{message}</p>}

          <DataTable
            headers={["", "Service", "Category", "Price", "Status", "Created", "Actions"]}
            empty={items.length === 0}
          >
            {items.map((s) => (
              <tr key={s.id}>
                <td className="px-2 py-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-slate-100">
                    {s.image ? (
                      <Image src={s.image} alt="" fill className="object-cover" sizes="48px" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-lg">{s.icon ?? "🦷"}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{s.name}</p>
                  <p className="font-mono text-xs text-slate-400">{s.slug}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {s.category?.name ?? categories.find((c) => c.id === s.categoryId)?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-sm">
                  {s.hidePrice ? "Hidden" : s.price ? formatCurrency(String(s.price)) : "—"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.enabled ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {s.enabled ? "Published" : "Draft"}
                  </span>
                  {s.featured && (
                    <span className="ml-2 text-xs text-amber-600">Featured</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {format(new Date(s.createdAt), "dd MMM yyyy")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <button type="button" title="Edit" onClick={() => openEdit(s)} className="rounded p-1 hover:bg-slate-100">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <a
                      href={`/services/${s.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View"
                      className="rounded p-1 hover:bg-slate-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      title={s.enabled ? "Unpublish" : "Publish"}
                      onClick={() => void togglePublish(s)}
                      className="rounded p-1 hover:bg-slate-100"
                    >
                      {s.enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      title="Featured"
                      onClick={() => void toggleFeatured(s)}
                      className={`rounded p-1 hover:bg-slate-100 ${s.featured ? "text-amber-500" : ""}`}
                    >
                      <Star className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => void deleteService(s.id)}
                      className="rounded p-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-2xl card-premium p-6 md:p-8">
            <h3 className="text-lg font-bold">{editingId ? "Edit service" : "Add service"}</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Service name *</Label>
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
                <Label>Service slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
              </div>
              <div>
                <Label>Category *</Label>
                <Select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <ImageUploadField
                  label="Service image *"
                  value={form.image}
                  onChange={(url) => setForm((f) => ({ ...f, image: url }))}
                />
              </div>
              <div>
                <Label>Icon (emoji)</Label>
                <Input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} />
              </div>
              <div>
                <Label>Treatment duration</Label>
                <Input
                  placeholder="e.g. 30–45 minutes"
                  value={form.treatmentDuration}
                  onChange={(e) => setForm((f) => ({ ...f, treatmentDuration: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Short description *</Label>
                <Textarea
                  rows={2}
                  value={form.shortDesc}
                  onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Detailed description *</Label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>What is this treatment?</Label>
                <Textarea
                  rows={3}
                  value={form.whatIsTreatment}
                  onChange={(e) => setForm((f) => ({ ...f, whatIsTreatment: e.target.value }))}
                />
              </div>
              <div>
                <Label>Starting price</Label>
                <Input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.hidePrice}
                    onChange={(e) => setForm((f) => ({ ...f, hidePrice: e.target.checked }))}
                  />
                  Hide price
                </label>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Label>Benefits</Label>
              {form.benefits.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={b}
                    onChange={(e) => {
                      const next = [...form.benefits];
                      next[i] = e.target.value;
                      setForm((f) => ({ ...f, benefits: next }));
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setForm((f) => ({ ...f, benefits: f.benefits.filter((_, j) => j !== i) }))
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
                onClick={() => setForm((f) => ({ ...f, benefits: [...f.benefits, ""] }))}
              >
                + Add benefit
              </Button>
            </div>

            <div className="mt-6 space-y-3">
              <Label>Treatment steps</Label>
              {form.treatmentSteps.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={b}
                    onChange={(e) => {
                      const next = [...form.treatmentSteps];
                      next[i] = e.target.value;
                      setForm((f) => ({ ...f, treatmentSteps: next }));
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        treatmentSteps: f.treatmentSteps.filter((_, j) => j !== i),
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
                onClick={() => setForm((f) => ({ ...f, treatmentSteps: [...f.treatmentSteps, ""] }))}
              >
                + Add step
              </Button>
            </div>

            <div className="mt-6 space-y-3">
              <Label>FAQs</Label>
              {form.faqs.map((faq, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-slate-100 p-3">
                  <Input
                    placeholder="Question"
                    value={faq.question}
                    onChange={(e) => {
                      const next = [...form.faqs];
                      next[i] = { ...next[i], question: e.target.value };
                      setForm((f) => ({ ...f, faqs: next }));
                    }}
                  />
                  <Textarea
                    rows={2}
                    placeholder="Answer"
                    value={faq.answer}
                    onChange={(e) => {
                      const next = [...form.faqs];
                      next[i] = { ...next[i], answer: e.target.value };
                      setForm((f) => ({ ...f, faqs: next }));
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setForm((f) => ({ ...f, faqs: f.faqs.filter((_, j) => j !== i) }))}
                  >
                    Remove FAQ
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setForm((f) => ({ ...f, faqs: [...f.faqs, { question: "", answer: "" }] }))
                }
              >
                + Add FAQ
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                />
                Featured service
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                />
                Published
              </label>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button type="button" disabled={saving} onClick={() => void saveService()}>
                {saving ? "Saving…" : "Save service"}
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
