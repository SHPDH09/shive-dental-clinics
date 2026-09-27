import Link from "next/link";
import { Play } from "lucide-react";
import { formatDuration, type PublicVideo } from "@/lib/public-video-types";
import { videoCategoryLabel } from "@/lib/video-categories";
import { format } from "date-fns";

export function VideoCard({ video }: { video: PublicVideo }) {
  const thumb = video.thumbnailUrl || undefined;

  return (
    <Link
      href={`/videos/${video.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div className="relative aspect-video overflow-hidden bg-slate-900">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-teal-800 to-slate-900 text-white/40">
            Video
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-teal-700 shadow-lg transition group-hover:scale-110">
            <Play className="h-8 w-8 fill-current pl-1" />
          </span>
        </div>
        {video.durationSeconds != null && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
            {formatDuration(video.durationSeconds)}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-600">
          {videoCategoryLabel(video.category)}
        </p>
        <h3 className="mt-1 line-clamp-2 font-semibold text-slate-900">{video.title}</h3>
        {video.description && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{video.description}</p>
        )}
        <p className="mt-3 text-xs text-slate-400">
          {format(new Date(video.createdAt), "MMM d, yyyy")}
        </p>
      </div>
    </Link>
  );
}
