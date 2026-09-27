import { auth } from "@/auth";
import { loadAdminContext } from "@/lib/admin-context";
import { can, roleDefaultPermissions } from "@/lib/rbac/permissions";
import { redirect } from "next/navigation";
import { AdminPageShell } from "@/components/admin/page-shell";
import { SettingsView } from "@/components/admin/settings-view";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/admin/login");
  }

  const admin = await loadAdminContext(session.user.id);
  const permissions =
    admin?.permissions ?? roleDefaultPermissions(session.user.role ?? undefined);
  if (!can(permissions, "settings", "view")) {
    redirect("/admin");
  }

  return (
    <AdminPageShell
      title="Settings"
      description="Clinic operations, website, communications, security, and integrations"
    >
      <SettingsView />
    </AdminPageShell>
  );
}
