"use client";

import { useMemo, useState } from "react";
import type { PublicBranch } from "@/lib/public-branch-types";
import { searchPublicBranches } from "@/lib/public-branch-utils";
import { BranchCard } from "@/components/public/branch-card";
import { Input, Label } from "@/components/ui/input";

export function BranchLocator({ branches }: { branches: PublicBranch[] }) {
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [pin, setPin] = useState("");

  const results = useMemo(
    () => searchPublicBranches(branches, { city, q: area, pin }),
    [branches, city, area, pin],
  );

  return (
    <div className="space-y-8">
      <div className="card-premium p-6 md:p-8">
        <h2 className="text-xl font-bold text-slate-900">Find a Clinic Near You</h2>
        <p className="mt-1 text-sm text-slate-600">Search by city, area, or PIN code.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <Label>City</Label>
            <Input placeholder="e.g. Mumbai" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <Label>Area</Label>
            <Input placeholder="Neighbourhood or landmark" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
          <div>
            <Label>PIN code</Label>
            <Input placeholder="6-digit PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {results.map((branch) => (
          <BranchCard key={branch.id} branch={branch} />
        ))}
      </div>
      {results.length === 0 && (
        <p className="text-center text-slate-500">No branches match your search. Try a nearby city.</p>
      )}
    </div>
  );
}
