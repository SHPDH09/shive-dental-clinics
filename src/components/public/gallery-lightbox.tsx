"use client";

import { X } from "lucide-react";
import { categoryLabel } from "@/lib/gallery-categories";
import { format } from "date-fns";
import type { PublicGalleryItem } from "@/lib/public-gallery";

type Props = {
  item: PublicGalleryItem | null;
  onClose: () => void;
};

export function GalleryLightbox({ item, onClose }: Props) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {item.mediaType === "VIDEO" ? (
          <video src={item.mediaUrl} controls autoPlay className="max-h-[60vh] w-full bg-black" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.mediaUrl} alt={item.title} className="max-h-[60vh] w-full object-contain bg-slate-100" />
        )}
        <div className="p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-600">
            {categoryLabel(item.category)}
          </p>
          <h3 className="mt-1 text-xl font-bold text-slate-900">{item.title}</h3>
          {item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}
          <p className="mt-3 text-xs text-slate-400">
            {format(new Date(item.createdAt), "MMMM d, yyyy")}
          </p>
        </div>
      </div>
    </div>
  );
}
