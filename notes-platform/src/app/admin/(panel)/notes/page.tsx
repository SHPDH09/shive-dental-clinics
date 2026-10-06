"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/modal";
import { api } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type NoteRow = {
  id: string;
  title: string;
  finalPrice: number;
  discountPercent: number;
  status: string;
  createdAt: string;
  coverImage?: string | null;
};

export default function AdminNotesPage() {
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [q, setQ] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    const data = await api<{ notes: NoteRow[] }>(`/api/admin/notes${params}`);
    setNotes(data.notes);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Notes Management</h1>
        <Link href="/admin/notes/create">
          <Button>Add Note</Button>
        </Link>
      </div>
      <div className="flex gap-2">
        <Input placeholder="Search notes..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="secondary" onClick={() => void load()}>
          Search
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Final Price</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr key={note.id} className="border-t">
                <td className="px-4 py-3">{note.title}</td>
                <td className="px-4 py-3">{formatCurrency(note.finalPrice)}</td>
                <td className="px-4 py-3">{note.discountPercent}%</td>
                <td className="px-4 py-3">{note.status}</td>
                <td className="px-4 py-3">{new Date(note.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/notes/edit/${note.id}`}>
                      <Button size="sm" variant="secondary">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await api(`/api/admin/notes/${note.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({ status: note.status === "ACTIVE" ? "DISABLED" : "ACTIVE" }),
                        });
                        toast.success("Status updated.");
                        await load();
                      }}
                    >
                      {note.status === "ACTIVE" ? "Disable" : "Enable"}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteId(note.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete note?"
        description="This action cannot be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await api(`/api/admin/notes/${deleteId}`, { method: "DELETE" });
          toast.success("Note deleted.");
          setDeleteId(null);
          await load();
        }}
      />
    </div>
  );
}
