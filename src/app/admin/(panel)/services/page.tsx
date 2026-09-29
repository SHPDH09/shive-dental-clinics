import { Suspense } from "react";
import { AdminPageShell } from "@/components/admin/page-shell";
import { LoadingState } from "@/components/admin/loading-state";
import { ServicesView } from "@/components/admin/services-view";

export default function AdminServicesPage() {
  return (
    <AdminPageShell
      title="Services"
      description="Manage treatments, categories, pricing, and featured services for the public website"
    >
      <Suspense fallback={<LoadingState label="Loading services…" />}>
        <ServicesView />
      </Suspense>
    </AdminPageShell>
  );
}
