import { AdminPageShell } from "@/components/admin/page-shell";
import { AdminProfileView } from "@/components/admin/admin-profile-view";

export default function AdminProfilePage() {
  return (
    <AdminPageShell title="My profile" description="Manage your account and password">
      <AdminProfileView />
    </AdminPageShell>
  );
}
