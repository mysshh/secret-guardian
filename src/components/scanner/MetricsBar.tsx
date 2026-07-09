import type { ScanMetrics } from "@/lib/scan-runner";

interface Props {
  metrics: ScanMetrics | null;
}

export function MetricsBar({ metrics }: Props) {
  if (!metrics) return null;
  const items = [
    { label: "Files discovered", value: metrics.filesDiscovered },
    { label: "Files scanned", value: metrics.filesScanned },
    { label: "Findings", value: metrics.findings },
    { label: "Duration", value: `${(metrics.durationMs / 1000).toFixed(2)}s` },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 rounded-2xl bg-white/60 border border-border/40 p-3 text-xs">
      {items.map((it) => (
        <div key={it.label} className="px-3 py-2">
          <div className="text-muted-foreground">{it.label}</div>
          <div className="font-mono text-sm text-foreground tabular-nums">{it.value}</div>
        </div>
      ))}
    </div>
  );
}
