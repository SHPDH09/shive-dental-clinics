"use client";

import { useRef, useState } from "react";
import { Film, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";

const MAX_VIDEO_MB = 50;

type Props = {
  videoUrl: string | null;
  onVideoUrl: (url: string) => void;
  onDuration?: (seconds: number) => void;
};

export function VideoUploadField({ videoUrl, onVideoUrl, onDuration }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const uploadFile = (file: File) => {
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`Max file size is ${MAX_VIDEO_MB}MB`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload?folder=videos");
    xhr.withCredentials = true;

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      try {
        const text = xhr.responseText?.trim() ?? "";
        if (!text) {
          throw new Error(
            xhr.status === 401
              ? "Please sign in again"
              : `Upload failed (${xhr.status}). Check storage configuration.`,
          );
        }
        const json = JSON.parse(text) as { url?: string; error?: string };
        if (xhr.status >= 400) throw new Error(json.error ?? "Upload failed");
        if (!json.url) throw new Error("Upload succeeded but no URL was returned");
        onVideoUrl(json.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError("Upload failed");
    };

    xhr.send(form);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const onMetadata = () => {
    const el = videoRef.current;
    if (el && Number.isFinite(el.duration) && onDuration) {
      onDuration(Math.round(el.duration));
    }
  };

  return (
    <div className="space-y-2">
      <Label>Video file * (MP4, WEBM, MOV — max {MAX_VIDEO_MB}MB)</Label>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-40 w-64 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="max-h-full max-w-full"
              controls
              onLoadedMetadata={onMetadata}
            />
          ) : (
            <Film className="h-12 w-12 text-slate-500" />
          )}
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Choose video
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mov"
              className="hidden"
              disabled={uploading}
              onChange={onFile}
            />
          </label>
          {uploading && (
            <div className="mt-3">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-teal-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">{progress}% uploaded</p>
            </div>
          )}
          {videoUrl && (
            <Button type="button" variant="ghost" className="mt-2 text-xs" onClick={() => onVideoUrl("")}>
              Remove / replace video
            </Button>
          )}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
