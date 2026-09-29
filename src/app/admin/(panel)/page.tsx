import { AdminPageShell } from "@/components/admin/page-shell";
import { DashboardView } from "@/components/admin/dashboard-view";

export default function AdminDashboardPage() {
  return (
    <AdminPageShell
      title="Dashboard"
      description="Real-time overview of appointments, patients, leads, and clinic performance."
    >
      <DashboardView />
    </AdminPageShell>
  );
}
