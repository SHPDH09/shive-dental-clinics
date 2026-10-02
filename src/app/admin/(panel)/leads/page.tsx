import { AdminPageShell } from "@/components/admin/page-shell";
import { LeadsCrmView } from "@/components/admin/leads/leads-crm-view";

export default function AdminLeadsPage() {
  return (
    <AdminPageShell title="Lead management" description="Capture, follow up, and convert enquiries across all channels">
      <LeadsCrmView />
    </AdminPageShell>
  );
}

