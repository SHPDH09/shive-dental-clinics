import { AdminPageShell } from "@/components/admin/page-shell";
import { MediaView } from "@/components/admin/media-view";

export default function AdminGalleryPage() {
  return (
    <AdminPageShell title="Gallery" description="Clinic photos for the public site">
      <MediaView mediaType="IMAGE" />
    </AdminPageShell>
  );
}
