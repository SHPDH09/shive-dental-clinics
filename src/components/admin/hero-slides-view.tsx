"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminApiError, adminFetch } from "@/lib/admin-client";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { LoadingState } from "@/components/admin/loading-state";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

type Slide = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  sortOrder: number;
  enabled: boolean;
};

export function HeroSlidesView() {
  const [items, setItems] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ items: Slide[] }>("/api/admin/hero-slides?limit=50");
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    setMessage(null);
    try {
      await adminFetch("/api/admin/hero-slides", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim() || "Welcome",
          subtitle: subtitle.trim() || null,
          imageUrl,
          sortOrder: items.length,
          enabled: true,
        }),
      });
      setTitle("");
      setSubtitle("");
      setImageUrl("");
      setMessage("Slide added.");
      await load();
    } catch (e) {
      setMessage(e instanceof AdminApiError ? e.message : "Could not add slide.");
    }
  };

  const toggle = async (s: Slide) => {
    await adminFetch(`/api/admin/hero-slides/${s.id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: !s.enabled }),
    });
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    await adminFetch(`/api/admin/hero-slides/${id}`, { method: "DELETE" });
    await load();
  };

  if (loading) return <LoadingState label="Loading hero slides…" />;

  return (
    <div className="space-y-8">
      {message && <p className="text-sm text-teal-700">{message}</p>}
      <div className="card-premium space-y-4 p-6">
        <h3 className="font-semibold text-slate-900">Add hero slide</h3>
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Comfort-first dentistry" />
        </div>
        <div>
          <Label>Subtitle</Label>
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Your trusted dental partner" />
        </div>
        <ImageUploadField label="Slide image" folder="hero" value={imageUrl} onChange={setImageUrl} />
        <Button type="button" disabled={!imageUrl} onClick={() => void add()}>
          Add slide
        </Button>
      </div>
      <ul className="space-y-3">
        {items.map((s) => (
          <li key={s.id} className="card-premium flex flex-wrap items-center gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.imageUrl} alt="" className="h-16 w-24 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">{s.title}</p>
              {s.subtitle && <p className="text-sm text-slate-500">{s.subtitle}</p>}
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => void toggle(s)}>
              {s.enabled ? "Enabled" : "Disabled"}
            </Button>
            <button type="button" className="text-red-600" onClick={() => void remove(s.id)}>
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
