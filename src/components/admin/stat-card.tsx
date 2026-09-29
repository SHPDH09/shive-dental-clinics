import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const accentStyles = {
  sky: "from-sky-500/15 to-sky-600/5 text-sky-700 ring-sky-200/60",
  amber: "from-amber-500/15 to-amber-600/5 text-amber-700 ring-amber-200/60",
  emerald: "from-emerald-500/15 to-emerald-600/5 text-emerald-700 ring-emerald-200/60",
  violet: "from-violet-500/15 to-violet-600/5 text-violet-700 ring-violet-200/60",
  rose: "from-rose-500/15 to-rose-600/5 text-rose-700 ring-rose-200/60",
  teal: "from-teal-500/15 to-teal-600/5 text-teal-700 ring-teal-200/60",
  gold: "from-yellow-500/20 to-amber-600/5 text-amber-800 ring-yellow-200/60",
} as const;

export type StatAccent = keyof typeof accentStyles;

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  accent = "sky",
  className,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  accent?: StatAccent;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "admin-stat-glow relative overflow-hidden rounded-2xl border border-white/80 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-sky-100/80 to-transparent"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{value}</p>
          {subtext ? <p className="mt-1 text-xs text-slate-500">{subtext}</p> : null}
        </div>
        <div
          className={cn(
            "shrink-0 rounded-xl bg-gradient-to-br p-2.5 ring-1",
            accentStyles[accent],
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>
      </div>
    </div>
  );
}
