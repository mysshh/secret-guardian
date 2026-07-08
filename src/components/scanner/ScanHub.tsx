import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_LEAKS, SCAN_STEPS, type Leak } from "@/lib/mock-data";
import { Console } from "./Console";
import { StatCards } from "./StatCards";
import { LeakTable } from "./LeakTable";
import { toast, Toaster } from "sonner";
import { GitBranch, Upload, Play, ShieldCheck } from "lucide-react";

type Mode = "precommit" | "full";

export function ScanHub() {
  const [url, setUrl] = useState("https://github.com/acme/payments-service");
  const [mode, setMode] = useState<Mode>("full");
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [leaks, setLeaks] = useState<Leak[]>([]);
  const [filesScanned, setFilesScanned] = useState(0);
  const [falsePositives, setFalsePositives] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startScan = useCallback(() => {
    if (running) return;
    timers.current.forEach(clearTimeout);
    setRunning(true);
    setLines([]);
    setLeaks([]);
    setFilesScanned(0);
    setFalsePositives(0);

    const steps =
      mode === "precommit" ? SCAN_STEPS.slice(0, 4).concat(SCAN_STEPS.slice(5)) : SCAN_STEPS;

    steps.forEach((step, i) => {
      const t = setTimeout(() => {
        setLines((prev) => [...prev, step]);
        if (i === steps.length - 1) {
          const results = mode === "precommit" ? MOCK_LEAKS.slice(0, 3) : MOCK_LEAKS;
          setLeaks(results);
          setFilesScanned(mode === "precommit" ? 14 : 1287);
          setFalsePositives(mode === "precommit" ? 3 : 27);
          setRunning(false);
          toast.success(`Scan complete — ${results.length} secrets detected`);
        }
      }, 550 * (i + 1));
      timers.current.push(t);
    });
  }, [mode, running]);

  const onFix = (id: string) => {
    setLeaks((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, fixed: true, masked: "process.env." + l.type.toUpperCase().replace(/\s+/g, "_") }
          : l,
      ),
    );
    toast.success("Secret swapped with environment variable");
  };

  const onIgnore = (id: string) => {
    setLeaks((prev) => prev.map((l) => (l.id === id ? { ...l, ignored: true } : l)));
    setFalsePositives((n) => n + 1);
    toast("Added to allowlist — hidden from future scans");
  };

  const onVerify = (id: string) => {
    setLeaks((prev) => prev.map((l) => (l.id === id ? { ...l, liveStatus: "Checking" } : l)));
    setTimeout(() => {
      setLeaks((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          const active = l.severity === "Critical" && Math.random() > 0.25;
          return { ...l, liveStatus: active ? "Active Threat" : "Inactive/Mock" };
        }),
      );
    }, 1200);
  };

  const onUpload = () => toast("Mock upload accepted — 12 files staged");

  return (
    <div className="min-h-screen bg-background">
      <Toaster theme="dark" position="bottom-right" />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-sky-600 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">GitLeak Sentinel</h1>
              <p className="text-xs text-muted-foreground">Secret scanner & leak detector</p>
            </div>
          </div>
          <span className="text-xs font-mono text-muted-foreground hidden sm:block">
            v1.0.0 · mock-mode
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Scan Hub */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold">Scan Hub</h2>
          </div>

          <div className="grid md:grid-cols-[1fr_auto] gap-3">
            <Input
              placeholder="https://github.com/org/repo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-mono text-sm"
            />
            <Button variant="outline" onClick={onUpload}>
              <Upload className="w-4 h-4 mr-2" /> Upload files
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
              <button
                onClick={() => setMode("precommit")}
                className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                  mode === "precommit"
                    ? "bg-emerald-500/20 text-emerald-300 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pre-Commit Hook
              </button>
              <button
                onClick={() => setMode("full")}
                className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                  mode === "full"
                    ? "bg-sky-500/20 text-sky-300 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Full Git History
              </button>
            </div>

            <Button
              onClick={startScan}
              disabled={running}
              className="bg-gradient-to-r from-emerald-500 to-sky-600 hover:opacity-90 text-white ml-auto"
            >
              <Play className="w-4 h-4 mr-2" />
              {running ? "Scanning..." : "Start Scan"}
            </Button>
          </div>
        </section>

        {/* Console */}
        <Console lines={lines} running={running} />

        {/* Triage Dashboard */}
        <section className="space-y-4">
          <h2 className="font-semibold">Smart Triage Dashboard</h2>
          <StatCards filesScanned={filesScanned} leaks={leaks} falsePositives={falsePositives} />
        </section>

        {/* Leak Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Detected Leaks</h2>
            <span className="text-xs text-muted-foreground">
              Verify runs a TruffleHog-style live API probe (mocked)
            </span>
          </div>
          <LeakTable leaks={leaks} onFix={onFix} onIgnore={onIgnore} onVerify={onVerify} />
        </section>
      </main>
    </div>
  );
}
