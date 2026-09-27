import { AdminPageShell } from "@/components/admin/page-shell";
import { BranchesView } from "@/components/admin/branches-view";

export default function AdminBranchesPage() {
  return (
    <AdminPageShell title="Branches" description="Clinic locations, timings, and open/closed status — shown in the website footer">
      <BranchesView />
    </AdminPageShell>
  );
}
