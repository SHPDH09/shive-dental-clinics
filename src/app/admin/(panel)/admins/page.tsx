import { AdminsView } from "@/components/admin/admins-view";
import { AdminPageShell } from "@/components/admin/page-shell";

export default function AdminsPage() {
  return (
    <AdminPageShell title="Admins">
      <AdminsView />
    </AdminPageShell>
  );
}
