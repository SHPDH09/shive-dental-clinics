import { AdminPageShell } from "@/components/admin/page-shell";
import { DoctorsView } from "@/components/admin/doctors-view";

export default function AdminDoctorsPage() {
  return (
    <AdminPageShell title="Doctor profiles" description="Add doctor photo, summary, and qualifications — shown on the homepage">
      <DoctorsView />
    </AdminPageShell>
  );
}
