"use client";

import { useRouter } from "next/navigation";
import { NoteForm } from "@/components/admin/note-form";
import { api } from "@/lib/client-api";

export default function CreateNotePage() {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Add Note</h1>
      <NoteForm
        onSubmit={async (values) => {
          await api("/api/admin/notes", { method: "POST", body: JSON.stringify(values) });
          router.push("/admin/notes");
        }}
      />
    </div>
  );
}
