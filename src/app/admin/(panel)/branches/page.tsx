import { AdminPageShell } from "@/components/admin/page-shell";
import { BranchesView } from "@/components/admin/branches-view";

export default function AdminBranchesPage() {
  return (
    <AdminPageShell
      title="Branches"
      description="Manage clinic locations, hours, doctors, services, and publishing for the public website"
    >
      <BranchesView />
    </AdminPageShell>
  );
}
