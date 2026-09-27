import { AdminPageShell } from "@/components/admin/page-shell";
import { PatientsView } from "@/components/admin/patients-view";

export default function AdminPatientsPage() {
  return (
    <AdminPageShell title="Patients" description="Patient records and history">
      <PatientsView />
    </AdminPageShell>
  );
}
