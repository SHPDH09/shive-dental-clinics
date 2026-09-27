import { VideoDetailClient } from "@/components/public/video-detail-client";
import { getPublicVideoById, getRelatedVideos } from "@/lib/public-videos";
import Link from "next/link";
import { getAuthUrl } from "@/lib/auth-env";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const video = await getPublicVideoById(id);
  if (!video) return { title: "Video not found" };
  return {
    title: `${video.title} | Shiv Dental Clinic`,
    description: video.description ?? undefined,
  };
}

export default async function VideoDetailPage({ params }: Props) {
  const { id } = await params;
  const video = await getPublicVideoById(id);
  if (!video) notFound();

  const related = await getRelatedVideos(video.category, video.id);
  const base = getAuthUrl()?.replace(/\/$/, "") ?? "";
  const shareUrl = `${base}/videos/${id}`;

  return (
    <div className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Link href="/videos" className="text-sm font-medium text-teal-700 hover:underline">
          ← All videos
        </Link>
        <div className="mt-6">
          <VideoDetailClient video={video} related={related} shareUrl={shareUrl} />
        </div>
      </div>
    </div>
  );
}
