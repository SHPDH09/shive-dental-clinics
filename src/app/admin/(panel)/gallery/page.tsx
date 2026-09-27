import { AdminPageShell } from "@/components/admin/page-shell";
import { GalleryView } from "@/components/admin/gallery-view";

export default function AdminGalleryPage() {
  return (
    <AdminPageShell
      title="Gallery"
      description="Upload images and videos — patient media stays private until you mark Public ✓"
    >
      <GalleryView defaultMediaType="ALL" />
    </AdminPageShell>
  );
}
