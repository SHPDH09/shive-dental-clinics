"use client";

import { useEffect } from "react";
import { VideoCard } from "@/components/public/video-card";
import { formatDuration, type PublicVideo } from "@/lib/public-video-types";
import { videoCategoryLabel } from "@/lib/video-categories";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VideoDetailClient({
  video,
  related,
  shareUrl,
}: {
  video: PublicVideo;
  related: PublicVideo[];
  shareUrl: string;
}) {
  useEffect(() => {
    void fetch(`/api/public/videos/${video.id}/view`, { method: "POST" });
  }, [video.id]);

  const onShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: video.title, url: shareUrl });
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    alert("Link copied to clipboard");
  };

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="overflow-hidden rounded-2xl bg-black shadow-xl">
          <video
            src={video.mediaUrl}
            controls
            playsInline
            preload="metadata"
            poster={video.thumbnailUrl ?? undefined}
            className="aspect-video w-full"
          />
        </div>
        <div className="mt-6">
          <p className="text-sm font-semibold text-teal-600">{videoCategoryLabel(video.category)}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">{video.title}</h1>
          {video.description && <p className="mt-4 text-slate-600">{video.description}</p>}
          <p className="mt-4 text-sm text-slate-500">
            {formatDuration(video.durationSeconds)} · {video.viewCount} views
          </p>
          <Button type="button" variant="secondary" className="mt-4" onClick={() => void onShare()}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Related videos</h2>
          <div className="mt-4 space-y-4">
            {related.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
