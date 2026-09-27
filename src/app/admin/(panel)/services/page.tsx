import { AdminPageShell } from "@/components/admin/page-shell";
import { ServicesView } from "@/components/admin/services-view";

export default function AdminServicesPage() {
  return (
    <AdminPageShell title="Services" description="Treatments offered at the clinic">
      <ServicesView />
    </AdminPageShell>
  );
}
