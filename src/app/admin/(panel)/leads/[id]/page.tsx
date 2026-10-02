import { AdminPageShell } from "@/components/admin/page-shell";
import { LeadProfileView } from "@/components/admin/leads/lead-profile-view";

type Props = { params: Promise<{ id: string }> };

export default async function AdminLeadProfilePage({ params }: Props) {
  const { id } = await params;
  return (
    <AdminPageShell title="Lead profile" description="CRM timeline and conversion">
      <LeadProfileView leadId={id} />
    </AdminPageShell>
  );
}
