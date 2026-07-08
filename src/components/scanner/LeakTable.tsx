import type { Leak, LiveStatus } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Wand2, EyeOff, Radio, CheckCircle2, Leaf } from "lucide-react";

interface Props {
  leaks: Leak[];
  onFix: (id: string) => void;
  onIgnore: (id: string) => void;
  onVerify: (id: string) => void;
}

function severityBadge(s: Leak["severity"]) {
  const map = {
    Critical: "bg-[oklch(0.92_0.07_25)] text-[oklch(0.42_0.15_25)]",
    Warning: "bg-[oklch(0.93_0.06_75)] text-[oklch(0.45_0.11_65)]",
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${map[s]}`}>
      {s}
    </span>
  );
}

function statusBadge(s: LiveStatus) {
  const map: Record<LiveStatus, string> = {
    Unknown: "bg-muted text-muted-foreground",
    Checking: "bg-[oklch(0.92_0.06_220)] text-[oklch(0.42_0.11_220)] animate-pulse",
    "Active Threat": "bg-[oklch(0.9_0.09_25)] text-[oklch(0.42_0.17_25)]",
    "Inactive/Mock": "bg-[oklch(0.92_0.07_155)] text-[oklch(0.42_0.1_155)]",
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${map[s]}`}>
      {s}
    </span>
  );
}

export function LeakTable({ leaks, onFix, onIgnore, onVerify }: Props) {
  const visible = leaks.filter((l) => !l.ignored);
  if (visible.length === 0)
    return (
      <div className="rounded-3xl bg-card border border-border/40 soft-shadow p-12 text-center">
        <Leaf className="w-8 h-8 mx-auto mb-3 text-sage" />
        <p className="text-muted-foreground text-sm">
          Your garden is quiet. Run a scan to surface any leaks.
        </p>
      </div>
    );

  return (
    <div className="rounded-3xl bg-card soft-shadow border border-border/40 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[oklch(0.96_0.02_100)] text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-4 font-medium">File</th>
              <th className="px-4 py-4 font-medium">Line</th>
              <th className="px-4 py-4 font-medium">Author</th>
              <th className="px-4 py-4 font-medium">Severity</th>
              <th className="px-4 py-4 font-medium">Secret</th>
              <th className="px-4 py-4 font-medium">Live Status</th>
              <th className="px-5 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((l) => (
              <tr
                key={l.id}
                className={`border-t border-border/40 transition-colors ${
                  l.fixed ? "bg-[oklch(0.96_0.04_155)]" : "hover:bg-[oklch(0.97_0.015_90)]"
                }`}
              >
                <td className="px-5 py-4 font-mono text-xs">{l.file}</td>
                <td className="px-4 py-4 font-mono text-xs text-muted-foreground">:{l.line}</td>
                <td className="px-4 py-4 text-xs">{l.author}</td>
                <td className="px-4 py-4">{severityBadge(l.severity)}</td>
                <td className="px-4 py-4">
                  <div className="font-mono text-xs">
                    <div className="text-muted-foreground">{l.type}</div>
                    <div className="text-foreground">{l.masked}</div>
                  </div>
                </td>
                <td className="px-4 py-4">{statusBadge(l.liveStatus)}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onVerify(l.id)}
                      disabled={l.liveStatus === "Checking" || l.fixed}
                      className="rounded-full border-border/60 bg-white/60 hover:bg-white"
                    >
                      <Radio className="w-3 h-3 mr-1" /> Verify
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onFix(l.id)}
                      disabled={l.fixed}
                      className="rounded-full bg-sage-deep hover:bg-[oklch(0.5_0.11_155)] text-white"
                    >
                      {l.fixed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Fixed
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3 h-3 mr-1" /> Auto-Fix
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onIgnore(l.id)}
                      className="rounded-full text-muted-foreground hover:bg-blush/40"
                    >
                      <EyeOff className="w-3 h-3 mr-1" /> Ignore
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
