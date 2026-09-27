import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminPageShell } from "@/components/admin/page-shell";
import { SettingsView } from "@/components/admin/settings-view";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
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
