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
    {
      label: "Files Scanned",
      value: filesScanned,
      icon: FileSearch,
      tint: "bg-[oklch(0.94_0.04_155)] text-[oklch(0.4_0.08_155)]",
      accent: "text-[oklch(0.45_0.1_155)]",
    },
    {
      label: "Secrets Found",
      value: found,
      icon: ShieldAlert,
      tint: "bg-[oklch(0.93_0.06_60)] text-[oklch(0.42_0.1_50)]",
      accent: "text-[oklch(0.48_0.13_45)]",
    },
    {
      label: "Active Threats",
      value: active,
      icon: Zap,
      tint: "bg-[oklch(0.9_0.07_25)] text-[oklch(0.42_0.15_25)]",
      accent: "text-[oklch(0.52_0.18_25)]",
    },
    {
      label: "Noise Filtered",
      value: falsePositives,
      icon: Filter,
      tint: "bg-[oklch(0.92_0.06_180)] text-[oklch(0.38_0.08_190)]",
      accent: "text-[oklch(0.45_0.09_190)]",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-3xl bg-card p-5 soft-shadow inner-glow border border-border/40 transition-transform hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl ${c.tint}`}>
              <c.icon className="w-5 h-5" />
            </span>
            <span className="text-xs text-muted-foreground">{c.label}</span>
          </div>
          <div className={`mt-4 text-3xl font-display font-semibold tabular-nums ${c.accent}`}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}
