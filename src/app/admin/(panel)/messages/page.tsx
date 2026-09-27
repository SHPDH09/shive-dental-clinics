import { AdminPageShell } from "@/components/admin/page-shell";
import { MessagesView } from "@/components/admin/messages-view";

export default function AdminMessagesPage() {
  return (
    <AdminPageShell title="Messages" description="Contact form enquiries">
      <MessagesView />
    </AdminPageShell>
  );
}
