"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function AdminDashboardPage() {
  const [data, setData] = useState<{
    stats: Record<string, number>;
    topNotes: { title: string; purchaseCount: number }[];
    recentPurchases: { student: string; note: string; amount: number }[];
  } | null>(null);

  useEffect(() => {
    void api<typeof data>("/api/admin/dashboard").then(setData);
  }, []);

  if (!data) return <p>Loading dashboard...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["Total Students", data.stats.totalStudents],
          ["Total Notes", data.stats.totalNotes],
          ["Total Purchases", data.stats.totalPurchases],
          ["Total Revenue", formatCurrency(data.stats.totalRevenue)],
          ["Total Transactions", data.stats.totalTransactions],
          ["Active Coupons", data.stats.activeCoupons],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Selling Notes</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topNotes}>
              <XAxis dataKey="title" hide />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="purchaseCount" fill="#4f46e5" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.recentPurchases.map((p, i) => (
            <p key={i}>
              {p.student} purchased <strong>{p.note}</strong> for {formatCurrency(p.amount)}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
