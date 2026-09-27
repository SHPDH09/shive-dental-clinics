import { AdminPageShell } from "@/components/admin/page-shell";
import { BeforeAfterView } from "@/components/admin/before-after-view";

export default function AdminBeforeAfterPage() {
  return (
    <AdminPageShell title="Before & after" description="Treatment result showcases">
      <BeforeAfterView />
    </AdminPageShell>
  );
}
