"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ReportsView() {
  return (
    <div className="card-premium max-w-lg space-y-4 p-8">
      <h2 className="font-semibold text-slate-900">Export data</h2>
      <p className="text-sm text-slate-600">
        Download CSV reports for appointments, patients, and leads from the admin API.
      </p>
      <div className="flex flex-wrap gap-3">
        {["appointments", "patients", "leads"].map((type) => (
          <a key={type} href={`/api/admin/reports/export?type=${type}`} className="inline-flex">
            <Button type="button" variant="secondary" size="sm">
              <Download className="h-4 w-4" />
              {type}
            </Button>
          </a>
        ))}
      </div>
    </div>
  );
}
