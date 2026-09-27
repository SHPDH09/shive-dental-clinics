import { AdminPageShell } from "@/components/admin/page-shell";
import { TestimonialsView } from "@/components/admin/testimonials-view";

export default function AdminTestimonialsPage() {
  return (
    <AdminPageShell title="Testimonials" description="Patient reviews shown on the website">
      <TestimonialsView />
    </AdminPageShell>
  );
}
