"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";

type Props = {
  label?: string;
  folder?: string;
  value: string | null;
  onChange: (url: string) => void;
};

export function ImageUploadField({ label = "Photo", folder = "doctors", value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/admin/upload?folder=${encodeURIComponent(folder)}`, {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onChange(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-slate-400">No image</span>
          )}
        </div>
        <div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload image
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} disabled={uploading} />
          </label>
          {value && (
            <Button type="button" variant="ghost" className="mt-2 block text-xs" onClick={() => onChange("")}>
              Remove
            </Button>
          )}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
