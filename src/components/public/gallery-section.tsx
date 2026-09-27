import Link from "next/link";
import { GalleryMasonry } from "@/components/public/gallery-masonry";
import type { PublicGalleryItem } from "@/lib/public-gallery";

export function GallerySection({ items }: { items: PublicGalleryItem[] }) {
  return (
    <section id="gallery" className="scroll-mt-24 bg-gradient-to-b from-white to-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">Gallery</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Inside Shiv Dental Clinic
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Take a look at our clinic, team, treatments and patient experiences.
          </p>
        </div>

        {items.length === 0 ? (
          <p className="mt-12 text-center text-sm text-slate-500">
            Gallery photos and videos will appear here once published by admin.
          </p>
        ) : (
          <GalleryMasonry items={items} limit={12} showFilters />
        )}

        <div className="mt-10 flex justify-center">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700"
          >
            View Full Gallery →
          </Link>
        </div>
      </div>
    </section>
  );
}
