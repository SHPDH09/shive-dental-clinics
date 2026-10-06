"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";

type Row = {
  id: string;
  transactionId?: string;
  studentName: string;
  studentEmail: string;
  noteName: string;
  amount: number;
  discount: number;
  coupon: string | null;
  finalAmount: number;
  paymentStatus: string;
  transactionStatus: string;
  date: string;
};

export default function AdminTransactionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    const data = await api<{ transactions: Row[] }>(`/api/admin/transactions${params}`);
    setRows(data.transactions);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Transactions</h1>
      <div className="flex gap-2">
        <Input placeholder="Search transactions" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="secondary" onClick={() => void load()}>
          Search
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">Txn ID</th>
              <th className="px-3 py-2 text-left">Student</th>
              <th className="px-3 py-2 text-left">Note</th>
              <th className="px-3 py-2 text-left">Final</th>
              <th className="px-3 py-2 text-left">Coupon</th>
              <th className="px-3 py-2 text-left">Payment</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-2 font-mono text-xs">{row.transactionId}</td>
                <td className="px-3 py-2">
                  <div>{row.studentName}</div>
                  <div className="text-xs text-slate-500">{row.studentEmail}</div>
                </td>
                <td className="px-3 py-2">{row.noteName}</td>
                <td className="px-3 py-2">{formatCurrency(row.finalAmount)}</td>
                <td className="px-3 py-2">{row.coupon ?? "—"}</td>
                <td className="px-3 py-2">{row.paymentStatus}</td>
                <td className="px-3 py-2">{row.transactionStatus}</td>
                <td className="px-3 py-2">{new Date(row.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
