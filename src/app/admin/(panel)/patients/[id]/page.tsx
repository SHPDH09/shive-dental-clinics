import { AdminPageShell } from "@/components/admin/page-shell";
import { PatientProfileView } from "@/components/admin/patients/patient-profile-view";

type Props = { params: Promise<{ id: string }> };

export default async function AdminPatientProfilePage({ params }: Props) {
  const { id } = await params;
  return (
    <AdminPageShell title="Patient profile" description="Complete patient record">
      <PatientProfileView patientId={id} />
    </AdminPageShell>
  );
}
