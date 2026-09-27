import { AdminPageShell } from "@/components/admin/page-shell";
import { MessagesView } from "@/components/admin/messages-view";

export default function AdminMessagesPage() {
  return (
    <AdminPageShell title="Messages" description="Manage patient enquiries, replies, assignments, and templates">
      <MessagesView />
    </AdminPageShell>
  );
}
