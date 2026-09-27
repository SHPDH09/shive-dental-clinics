import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
      {label}
    </div>
  );
}
