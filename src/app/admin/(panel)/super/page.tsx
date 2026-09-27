import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminPageShell } from "@/components/admin/page-shell";
import { SuperAdminView } from "@/components/admin/super-admin-view";

export default async function SuperAdminPage() {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  return (
    <AdminPageShell title="Super admin panel" description="Staff stats, audit trail, and system health">
      <SuperAdminView />
    </AdminPageShell>
  );
}
