import { VideoCard } from "@/components/public/video-card";
import { getPublicVideos } from "@/lib/public-videos";
import Link from "next/link";

export const metadata = {
  title: "Watch & Learn | Shiv Dental Clinic",
  description: "Dental tips, treatments, and patient experiences from Shiv Dental Clinic.",
};

export default async function VideosPage() {
  const videos = await getPublicVideos(100);

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">Videos</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">Watch &amp; Learn</h1>
          <p className="mt-3 text-slate-600">
            Helpful dental tips, treatment information and real experiences from Shiv Dental Clinic.
          </p>
        </div>

        {videos.length === 0 ? (
          <p className="mt-12 text-slate-500">New videos will appear here once published by the clinic.</p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        )}

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
