import { ImageIcon } from "lucide-react";

type MediaItem = {
  id: string;
  title: string;
  mediaUrl: string;
  description: string | null;
};

export function GallerySection({ items }: { items: MediaItem[] }) {
  return (
    <section id="gallery" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="section-title">Clinic gallery</h2>
        <p className="section-subtitle">A glimpse of our modern, welcoming space.</p>
        {items.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-slate-400">
            <ImageIcon className="h-10 w-10" />
            <p className="mt-2 text-sm">Gallery photos coming soon</p>
          </div>
        ) : (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <figure key={item.id} className="group overflow-hidden rounded-2xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.mediaUrl}
                  alt={item.title}
                  className="aspect-square w-full object-cover transition group-hover:scale-105"
                />
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
