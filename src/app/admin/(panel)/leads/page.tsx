import { AdminPageShell } from "@/components/admin/page-shell";
import { LeadsView } from "@/components/admin/leads-view";

export default function AdminLeadsPage() {
  return (
    <AdminPageShell title="Leads" description="Track inquiries and follow-ups">
      <LeadsView />
    </AdminPageShell>
  );
}
