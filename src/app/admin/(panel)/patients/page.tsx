import { AdminPageShell } from "@/components/admin/page-shell";
import { PatientsManagementView } from "@/components/admin/patients/patients-management-view";

export default function AdminPatientsPage() {
  return (
    <AdminPageShell
      title="Patient management"
      description="Profiles, appointments, treatment history, and follow-ups — secure clinic CRM"
    >
      <PatientsManagementView />
    </AdminPageShell>
  );
}
