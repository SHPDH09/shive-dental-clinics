import { AdminPageShell } from "@/components/admin/page-shell";
import { AppointmentsView } from "@/components/admin/appointments-view";

export default function AdminAppointmentsPage() {
  return (
    <AdminPageShell title="Appointments" description="Manage booking requests and schedules">
      <AppointmentsView />
    </AdminPageShell>
  );
}
