"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { calculateNoteFinalPrice } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type NoteFormValues = {
  name: string;
  title: string;
  description: string;
  coverImage?: string | null;
  pdfPath?: string | null;
  notesLink?: string | null;
  price: number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  status: "ACTIVE" | "DISABLED";
};

export function NoteForm({
  initial,
  onSubmit,
}: {
  initial?: Partial<NoteFormValues>;
  onSubmit: (values: NoteFormValues) => Promise<void>;
}) {
  const [form, setForm] = useState<NoteFormValues>({
    name: initial?.name ?? "",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    coverImage: initial?.coverImage ?? null,
    pdfPath: initial?.pdfPath ?? null,
    notesLink: initial?.notesLink ?? "",
    price: initial?.price ?? 499,
    discountType: initial?.discountType ?? "PERCENTAGE",
    discountValue: initial?.discountValue ?? 10,
    status: initial?.status ?? "ACTIVE",
  });
  const [loading, setLoading] = useState(false);

  const finalPrice = calculateNoteFinalPrice(form.price, form.discountType, form.discountValue);

  async function upload(kind: "cover" | "pdf", file: File) {
    const body = new FormData();
    body.set("kind", kind);
    body.set("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body });
    const data = (await res.json()) as { url?: string; path?: string; error?: string };
    if (!res.ok) throw new Error(data.error || "Upload failed.");
    if (kind === "cover" && data.url) setForm((f) => ({ ...f, coverImage: data.url! }));
    if (kind === "pdf" && data.path) setForm((f) => ({ ...f, pdfPath: data.path! }));
  }

  return (
    <form
      className="space-y-4 rounded-2xl border bg-white p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          await onSubmit({
            ...form,
            notesLink: form.notesLink?.trim() || null,
          });
          toast.success("Note saved.");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Save failed.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <Input placeholder="Notes name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <Input placeholder="Notes title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      <textarea
        className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        required
      />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          Cover image
          <input
            type="file"
            accept="image/*"
            className="mt-1 block w-full text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload("cover", file).catch((err) => toast.error(err.message));
            }}
          />
        </label>
        <label className="text-sm">
          PDF upload
          <input
            type="file"
            accept="application/pdf"
            className="mt-1 block w-full text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload("pdf", file).catch((err) => toast.error(err.message));
            }}
          />
        </label>
      </div>
      <Input
        placeholder="External notes link (optional if PDF uploaded)"
        value={form.notesLink ?? ""}
        onChange={(e) => setForm({ ...form, notesLink: e.target.value })}
      />
      <div className="grid gap-3 md:grid-cols-3">
        <Input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
        <select
          className="h-11 rounded-xl border px-3 text-sm"
          value={form.discountType}
          onChange={(e) => setForm({ ...form, discountType: e.target.value as "PERCENTAGE" | "FIXED" })}
        >
          <option value="PERCENTAGE">Percentage discount</option>
          <option value="FIXED">Fixed discount</option>
        </select>
        <Input type="number" placeholder="Discount value" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} />
      </div>
      <p className="text-sm font-semibold text-indigo-700">Final price: {formatCurrency(finalPrice)}</p>
      <select className="h-11 rounded-xl border px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "ACTIVE" | "DISABLED" })}>
        <option value="ACTIVE">Active</option>
        <option value="DISABLED">Disabled</option>
      </select>
      <Button disabled={loading}>{loading ? "Saving..." : "Save Note"}</Button>
    </form>
  );
}
