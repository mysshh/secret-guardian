import type { Leak, LiveStatus } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Wand2, EyeOff, Radio, CheckCircle2 } from "lucide-react";

interface Props {
  leaks: Leak[];
  onFix: (id: string) => void;
  onIgnore: (id: string) => void;
  onVerify: (id: string) => void;
}

function severityBadge(s: Leak["severity"]) {
  const map = {
    Critical: "bg-red-500/15 text-red-400 border-red-500/30",
    Warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };
  return <span className={`px-2 py-0.5 text-xs rounded-md border ${map[s]}`}>{s}</span>;
}

function statusBadge(s: LiveStatus) {
  const map: Record<LiveStatus, string> = {
    Unknown: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    Checking: "bg-sky-500/15 text-sky-400 border-sky-500/30 animate-pulse",
    "Active Threat": "bg-red-500/20 text-red-300 border-red-500/40",
    "Inactive/Mock": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  return <span className={`px-2 py-0.5 text-xs rounded-md border ${map[s]}`}>{s}</span>;
}

export function LeakTable({ leaks, onFix, onIgnore, onVerify }: Props) {
  const visible = leaks.filter((l) => !l.ignored);
  if (visible.length === 0)
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
        No leaks to display. Run a scan to populate results.
      </div>
    );

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Line</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Secret</th>
              <th className="px-4 py-3">Live Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((l) => (
              <tr
                key={l.id}
                className={`border-t border-border transition-colors ${
                  l.fixed ? "bg-emerald-500/5" : "hover:bg-muted/20"
                }`}
              >
                <td className="px-4 py-3 font-mono text-xs">{l.file}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">:{l.line}</td>
                <td className="px-4 py-3 text-xs">{l.author}</td>
                <td className="px-4 py-3">{severityBadge(l.severity)}</td>
                <td className="px-4 py-3">
                  <div className="font-mono text-xs">
                    <div className="text-muted-foreground">{l.type}</div>
                    <div className="text-foreground">{l.masked}</div>
                  </div>
                </td>
                <td className="px-4 py-3">{statusBadge(l.liveStatus)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onVerify(l.id)}
                      disabled={l.liveStatus === "Checking" || l.fixed}
                    >
                      <Radio className="w-3 h-3 mr-1" /> Verify
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onFix(l.id)}
                      disabled={l.fixed}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
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
                    <Button size="sm" variant="ghost" onClick={() => onIgnore(l.id)}>
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
