"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type Student = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  createdAt: string;
  totalPurchases: number;
  totalSpent: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Student[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  async function load() {
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    const data = await api<{ users: Student[] }>(`/api/admin/users${params}`);
    setUsers(data.users);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Student Management</h1>
      <form
        className="grid gap-2 rounded-2xl border bg-white p-4 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await api("/api/admin/users", { method: "POST", body: JSON.stringify(form) });
          toast.success("Student created.");
          setForm({ name: "", email: "", phone: "", password: "" });
          await load();
        }}
      >
        <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <Button className="md:col-span-2">Add Student</Button>
      </form>
      <div className="flex gap-2">
        <Input placeholder="Search students" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="secondary" onClick={() => void load()}>
          Search
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Purchases</th>
              <th className="px-4 py-3 text-left">Spent</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.totalPurchases}</td>
                <td className="px-4 py-3">{formatCurrency(u.totalSpent)}</td>
                <td className="px-4 py-3">{u.status}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`}>
                    <Button size="sm" variant="secondary">
                      View
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
