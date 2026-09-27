"use client";

import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { GALLERY_CATEGORIES, categoryLabel } from "@/lib/gallery-categories";
import { GalleryLightbox } from "@/components/public/gallery-lightbox";
import type { PublicGalleryItem } from "@/lib/public-gallery";

type Props = {
  items: PublicGalleryItem[];
  limit?: number;
  showFilters?: boolean;
};

export function GalleryMasonry({ items, limit, showFilters = true }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const [lightbox, setLightbox] = useState<PublicGalleryItem | null>(null);

  const filtered = useMemo(() => {
    let list = items;
    if (filter !== "all") {
      list = list.filter((i) => i.category === filter);
    }
    if (limit) list = list.slice(0, limit);
    return list;
  }, [items, filter, limit]);

  return (
    <>
      {showFilters && (
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All" />
          {GALLERY_CATEGORIES.map((c) => (
            <FilterChip
              key={c.id}
              active={filter === c.id}
              onClick={() => setFilter(c.id)}
              label={`${c.emoji} ${c.label}`}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-12 text-center text-sm text-slate-500">No media in this category yet.</p>
      ) : (
        <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightbox(item)}
              className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-slate-100 text-left shadow-sm transition hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500"
            >
              <div className="relative overflow-hidden">
                {item.mediaType === "VIDEO" ? (
                  <>
                    <video
                      src={item.mediaUrl}
                      className="w-full object-cover transition duration-500 group-hover:scale-105"
                      muted
                      playsInline
                      preload="none"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-teal-700 shadow-lg">
                        <Play className="h-7 w-7 fill-current pl-0.5" />
                      </span>
                    </span>
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.mediaUrl}
                    alt={item.title}
                    loading="lazy"
                    className="w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-4 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-200">
                    {categoryLabel(item.category)}
                  </p>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <GalleryLightbox item={lightbox} onClose={() => setLightbox(null)} />
    </>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
        active
          ? "bg-teal-600 text-white shadow-md"
          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}
