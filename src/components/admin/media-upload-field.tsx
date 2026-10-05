"use client";

import { useState } from "react";
import { Film, Upload } from "lucide-react";
import { ButtonLogoSpinner } from "@/components/branding/button-logo-spinner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { parseJsonResponse } from "@/lib/parse-json-response";

type Props = {
  label?: string;
  folder?: string;
  mediaType: "IMAGE" | "VIDEO";
  value: string | null;
  onChange: (url: string) => void;
};

export function MediaUploadField({
  label = "Media file",
  folder = "gallery",
  mediaType,
  value,
  onChange,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept =
    mediaType === "VIDEO" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp";

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
        credentials: "same-origin",
      });
      const json = await parseJsonResponse<{ url?: string; error?: string }>(res);
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      if (!json.url) throw new Error("Upload succeeded but no URL was returned");
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
      <Label>{label} *</Label>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-36 w-48 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {value ? (
            mediaType === "VIDEO" ? (
              <video src={value} className="h-full w-full object-cover" controls muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="Preview" className="h-full w-full object-cover" />
            )
          ) : mediaType === "VIDEO" ? (
            <Film className="h-10 w-10 text-slate-300" />
          ) : (
            <span className="text-xs text-slate-400">No file</span>
          )}
        </div>
        <div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
            {uploading ? <ButtonLogoSpinner label="Uploading…" /> : <Upload className="h-4 w-4" />}
            Choose file
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={onFile}
              disabled={uploading}
            />
          </label>
          {value && (
            <Button type="button" variant="ghost" className="mt-2 block text-xs" onClick={() => onChange("")}>
              Remove / replace
            </Button>
          )}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
