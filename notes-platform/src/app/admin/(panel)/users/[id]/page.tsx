"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{
    user: { name: string; email: string; phone?: string | null; status: string };
    totalSpent: number;
    purchases: { title?: string; purchasedPrice: number }[];
    transactions: { externalId: string; amount: number }[];
  } | null>(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    void api<NonNullable<typeof data>>(`/api/admin/users/${id}`).then(setData);
  }, [id]);

  if (!data) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{data.user.name}</h1>
      <div className="rounded-2xl border bg-white p-4 text-sm">
        <p>Email: {data.user.email}</p>
        <p>Phone: {data.user.phone || "—"}</p>
        <p>Status: {data.user.status}</p>
        <p>Total spent: {formatCurrency(data.totalSpent)}</p>
      </div>
      <div className="flex gap-2">
        <Input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button
          variant="secondary"
          onClick={async () => {
            await api(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ newPassword: password }) });
            toast.success("Password reset.");
            setPassword("");
          }}
        >
          Reset Password
        </Button>
      </div>
      <div className="rounded-2xl border bg-white p-4">
        <h2 className="font-semibold">Purchased Notes</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {data.purchases.map((p, i) => (
            <li key={i}>
              {p.title} — {formatCurrency(p.purchasedPrice)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
