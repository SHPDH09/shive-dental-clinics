import { GalleryMasonry } from "@/components/public/gallery-masonry";
import { getPublicGalleryItems } from "@/lib/public-gallery";
import Link from "next/link";

export const metadata = {
  title: "Gallery | Shiv Dental Clinic",
  description: "Photos and videos from Shiv Dental Clinic — clinic, team, treatments, and more.",
};

export default async function GalleryPage() {
  const items = await getPublicGalleryItems(200);

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">Gallery</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">Inside Shiv Dental Clinic</h1>
          <p className="mt-3 text-slate-600">
            Take a look at our clinic, team, treatments and patient experiences.
          </p>
        </div>

        <GalleryMasonry items={items} showFilters />

        <div className="mt-12">
          <Link
            href="/"
            className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
