import { AdminPageShell } from "@/components/admin/page-shell";
import { MediaView } from "@/components/admin/media-view";

export default function AdminVideosPage() {
  return (
    <AdminPageShell title="Videos" description="Video media for marketing">
      <MediaView mediaType="VIDEO" />
    </AdminPageShell>
  );
}
