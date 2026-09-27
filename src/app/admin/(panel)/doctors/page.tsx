import { AdminPageShell } from "@/components/admin/page-shell";
import { DoctorsView } from "@/components/admin/doctors-view";

export default function AdminDoctorsPage() {
  return (
    <AdminPageShell
      title="Doctors"
      description="Manage doctor profiles, availability, featured placement, and publishing for the public website"
    >
      <DoctorsView />
    </AdminPageShell>
  );
}
