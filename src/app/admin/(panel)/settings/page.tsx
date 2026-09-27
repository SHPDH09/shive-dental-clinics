import { AdminPageShell } from "@/components/admin/page-shell";
import { SettingsView } from "@/components/admin/settings-view";

export default function AdminSettingsPage() {
  return (
    <AdminPageShell title="Settings" description="Clinic profile and SEO">
      <SettingsView />
    </AdminPageShell>
  );
}
