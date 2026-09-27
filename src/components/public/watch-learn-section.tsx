import Link from "next/link";
import { VideoCard } from "@/components/public/video-card";
import type { PublicVideo } from "@/lib/public-video-types";

export function WatchLearnSection({ videos }: { videos: PublicVideo[] }) {
  if (videos.length === 0) return null;

  const preview = videos.slice(0, 6);

  return (
    <section id="videos" className="scroll-mt-24 bg-slate-900 py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-300">Videos</p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Watch &amp; Learn</h2>
          <p className="mt-3 text-slate-300">
            Helpful dental tips, treatment information and real experiences from Shiv Dental Clinic.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/videos"
            className="inline-flex rounded-full bg-teal-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-400"
          >
            Browse all videos →
          </Link>
        </div>
      </div>
    </section>
  );
}
