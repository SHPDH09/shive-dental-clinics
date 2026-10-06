"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";

type Tx = {
  id: string;
  externalId: string;
  amount: number;
  paymentStatus: string;
  createdAt: string;
  notes?: string;
};

export default function TransactionsPage() {
  const [rows, setRows] = useState<Tx[]>([]);

  useEffect(() => {
    void api<{ transactions: Tx[] }>("/api/transactions").then((d) => setRows(d.transactions));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Transactions</h1>
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Transaction ID</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tx) => (
              <tr key={tx.id} className="border-t">
                <td className="px-4 py-3 font-mono text-xs">{tx.externalId}</td>
                <td className="px-4 py-3">{tx.notes}</td>
                <td className="px-4 py-3">{formatCurrency(tx.amount)}</td>
                <td className="px-4 py-3">{tx.paymentStatus}</td>
                <td className="px-4 py-3">{new Date(tx.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
