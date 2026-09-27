import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <AdminHeader />
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
