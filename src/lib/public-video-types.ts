export type PublicVideo = {
  id: string;
  title: string;
  description: string | null;
  mediaUrl: string;
  thumbnailUrl: string | null;
  category: string;
  durationSeconds: number | null;
  viewCount: number;
  createdAt: Date;
};

export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
