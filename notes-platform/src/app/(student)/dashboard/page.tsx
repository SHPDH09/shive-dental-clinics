"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Student Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Cart", href: "/cart", text: "Review items and apply coupons." },
          { title: "Purchased Notes", href: "/purchases", text: "Access your library securely." },
          { title: "Transactions", href: "/transactions", text: "Track payment history." },
          { title: "Profile", href: "/profile", text: "Update account details." },
        ].map((item) => (
          <Card key={item.href}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">{item.text}</p>
              <Link href={item.href}>
                <Button size="sm">Open</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      <Link href="/notes">
        <Button variant="secondary">Browse more notes</Button>
      </Link>
    </div>
  );
}
