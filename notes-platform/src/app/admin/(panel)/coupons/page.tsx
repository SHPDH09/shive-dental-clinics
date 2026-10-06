"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client-api";
import { toast } from "sonner";

type Coupon = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  usedCount: number;
  maxUsers: number | null;
  status: string;
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    maxUsers: 100,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
    minPurchaseAmount: 0,
  });

  async function load() {
    const data = await api<{ coupons: Coupon[] }>("/api/admin/coupons");
    setCoupons(data.coupons);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Coupon Management</h1>
      <form
        className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await api("/api/admin/coupons", { method: "POST", body: JSON.stringify(form) });
          toast.success("Coupon created successfully.");
          await load();
        }}
      >
        <Input placeholder="Coupon code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
        <select className="h-11 rounded-xl border px-3 text-sm" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED">Fixed amount</option>
        </select>
        <Input type="number" placeholder="Discount value" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} />
        <Input type="number" placeholder="Max users" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })} />
        <Button className="md:col-span-2">Create Coupon</Button>
      </form>
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Usage</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3 font-mono">{c.code}</td>
                <td className="px-4 py-3">
                  {c.discountType} ({c.discountValue})
                </td>
                <td className="px-4 py-3">
                  {c.usedCount}/{c.maxUsers ?? "∞"}
                </td>
                <td className="px-4 py-3">{c.status}</td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await api(`/api/admin/coupons/${c.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: c.status === "ACTIVE" ? "DISABLED" : "ACTIVE" }),
                      });
                      await load();
                    }}
                  >
                    Toggle
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
