import { auth } from "@/auth";
import { loadAdminContext } from "@/lib/admin-context";
import { can, roleDefaultPermissions } from "@/lib/rbac/permissions";
import { redirect } from "next/navigation";
import { AdminPageShell } from "@/components/admin/page-shell";
import { HeroSlidesView } from "@/components/admin/hero-slides-view";

export default async function HeroSlidesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");

  const admin = await loadAdminContext(session.user.id);
  const permissions = admin?.permissions ?? roleDefaultPermissions(session.user.role ?? undefined);
  if (!can(permissions, "settings", "view")) redirect("/admin");

  return (
    <AdminPageShell title="Hero slides" description="Homepage carousel images and captions">
      <HeroSlidesView />
    </AdminPageShell>
  );
}
