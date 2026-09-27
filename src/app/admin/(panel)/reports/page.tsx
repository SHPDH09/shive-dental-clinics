import { AdminPageShell } from "@/components/admin/page-shell";
import { ReportsView } from "@/components/admin/reports-view";

export default function AdminReportsPage() {
  return (
    <AdminPageShell title="Reports" description="Export clinic data">
      <ReportsView />
    </AdminPageShell>
  );
}
