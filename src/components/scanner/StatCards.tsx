import type { Leak } from "@/lib/mock-data";
import { FileSearch, ShieldAlert, Zap, Filter } from "lucide-react";

interface Props {
  filesScanned: number;
  leaks: Leak[];
  falsePositives: number;
}

export function StatCards({ filesScanned, leaks, falsePositives }: Props) {
  const found = leaks.filter((l) => !l.ignored).length;
  const active = leaks.filter((l) => l.liveStatus === "Active Threat" && !l.fixed).length;

  const cards = [
    { label: "Files Scanned", value: filesScanned, icon: FileSearch, color: "text-sky-400", ring: "ring-sky-500/20" },
    { label: "Secrets Found", value: found, icon: ShieldAlert, color: "text-amber-400", ring: "ring-amber-500/20" },
    { label: "Active Threats", value: active, icon: Zap, color: "text-red-400", ring: "ring-red-500/20" },
    { label: "False Positives Filtered", value: falsePositives, icon: Filter, color: "text-emerald-400", ring: "ring-emerald-500/20" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-lg border border-border bg-card p-5 ring-1 ${c.ring} hover-scale`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{c.label}</span>
            <c.icon className={`w-5 h-5 ${c.color}`} />
          </div>
          <div className={`mt-3 text-3xl font-bold tabular-nums ${c.color}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
