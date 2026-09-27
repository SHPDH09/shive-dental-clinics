export const dynamic = "force-dynamic";

import { AdminShell } from "@/components/admin/admin-shell";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/admin/login?callbackUrl=/admin");
  }

  return <AdminShell>{children}</AdminShell>;
}
