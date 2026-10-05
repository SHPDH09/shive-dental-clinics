"use client";

import { useEffect, useState } from "react";
import { adminFetch, type Paginated } from "@/lib/admin-client";
import { DataTable } from "@/components/admin/data-table";
import { DataLoadingSection } from "@/components/admin/loading-state";

type Media = {
  id: string;
  title: string;
  mediaType: string;
  mediaUrl: string;
  status: string;
  isPublic: boolean;
};

export function MediaView({ mediaType }: { mediaType: "IMAGE" | "VIDEO" }) {
  const [data, setData] = useState<Paginated<Media> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch<Paginated<Media>>("/api/admin/media?limit=50")
      .then((res) => ({
        ...res,
        items: res.items.filter((m) => m.mediaType === mediaType),
      }))
      .then(setData)
      .finally(() => setLoading(false));
  }, [mediaType]);

  const items = data?.items ?? [];

  return (
    <DataLoadingSection loading={loading} label="Loading media…" minHeight="min-h-[240px]">
    <DataTable headers={["Title", "URL", "Status", "Public"]} empty={items.length === 0}>
      {items.map((m) => (
        <tr key={m.id}>
          <td className="px-4 py-3 font-medium">{m.title}</td>
          <td className="max-w-xs truncate px-4 py-3 text-xs text-slate-500">{m.mediaUrl}</td>
          <td className="px-4 py-3">{m.status}</td>
          <td className="px-4 py-3">{m.isPublic ? "Yes" : "No"}</td>
        </tr>
      ))}
    </DataTable>
    </DataLoadingSection>
  );
}
