import { AdminPageShell } from "@/components/admin/page-shell";
import { ServicesView } from "@/components/admin/services-view";

export default function AdminServicesPage() {
  return (
    <AdminPageShell
      title="Services"
      description="Manage treatments, categories, pricing, and featured services for the public website"
    >
      <ServicesView />
    </AdminPageShell>
  );
}
