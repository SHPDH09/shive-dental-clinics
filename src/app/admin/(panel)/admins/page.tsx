import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminsView } from "@/components/admin/admins-view";
import { AdminPageShell } from "@/components/admin/page-shell";

export default async function AdminsPage() {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  return (
    <AdminPageShell
      title="Admin management"
      description="Manage staff accounts, roles, permissions, and activity"
    >
      <AdminsView />
    </AdminPageShell>
  );
}
