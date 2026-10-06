"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { NoteForm } from "@/components/admin/note-form";
import { api } from "@/lib/client-api";

export default function EditNotePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void api<{ note: Record<string, unknown> }>(`/api/admin/notes/${id}`).then((d) => setInitial(d.note));
  }, [id]);

  if (!initial) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Edit Note</h1>
      <NoteForm
        initial={initial as never}
        onSubmit={async (values) => {
          await api(`/api/admin/notes/${id}`, { method: "PATCH", body: JSON.stringify(values) });
          router.push("/admin/notes");
        }}
      />
    </div>
  );
}
