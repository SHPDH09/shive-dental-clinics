import { AdminPageShell } from "@/components/admin/page-shell";
import { GalleryView } from "@/components/admin/gallery-view";

export default function AdminVideosPage() {
  return (
    <AdminPageShell title="Videos" description="Video gallery — managed together with clinic gallery">
      <GalleryView defaultMediaType="VIDEO" />
    </AdminPageShell>
  );
}
