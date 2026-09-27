import { AdminPageShell } from "@/components/admin/page-shell";
import { DashboardView } from "@/components/admin/dashboard-view";

export default function AdminDashboardPage() {
  return (
    <AdminPageShell title="Dashboard" description="Overview of clinic activity">
      <DashboardView />
    </AdminPageShell>
  );
}
