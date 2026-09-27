import { AdminPageShell } from "@/components/admin/page-shell";
import { TestimonialsView } from "@/components/admin/testimonials-view";

export default function AdminTestimonialsPage() {
  return (
    <AdminPageShell
      title="Testimonials"
      description="Add, edit, publish, and upload photos for the homepage patient carousel"
    >
      <TestimonialsView />
    </AdminPageShell>
  );
}
