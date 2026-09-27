import { AdminPageShell } from "@/components/admin/page-shell";
import { ReportsView } from "@/components/admin/reports-view";

export default function AdminReportsPage() {
  return (
    <AdminPageShell
      title="Reports & Analytics"
      description="Appointments, patients, leads, services, doctors, and branch performance in one place"
    >
      <ReportsView />
    </AdminPageShell>
  );
}
