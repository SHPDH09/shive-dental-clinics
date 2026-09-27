import { AdminPageShell } from "@/components/admin/page-shell";
import { DoctorsView } from "@/components/admin/doctors-view";

export default function AdminDoctorsPage() {
  return (
    <AdminPageShell title="Doctors" description="Dental team profiles">
      <DoctorsView />
    </AdminPageShell>
  );
}
