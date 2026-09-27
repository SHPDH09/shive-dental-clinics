import { AdminPageShell } from "@/components/admin/page-shell";
import { VideosView } from "@/components/admin/videos-view";

export default function AdminVideosPage() {
  return (
    <AdminPageShell
      title="Videos"
      description="Upload, preview, and publish clinic videos — patient content stays private by default"
    >
      <VideosView />
    </AdminPageShell>
  );
}
