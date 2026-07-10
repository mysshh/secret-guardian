import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Leak } from "@/lib/mock-data";
import {
  scanGithubUrl,
  scanLooseFiles,
  scanZip,
  type Logger,
  type ScanMetrics,
} from "@/lib/scan-runner";
import { Console } from "./Console";
import { StatCards } from "./StatCards";
import { LeakTable } from "./LeakTable";
import { MetricsBar } from "./MetricsBar";
import { toast, Toaster } from "sonner";
import { GitBranch, Upload, Play, Leaf, Sparkles, X, AlertCircle } from "lucide-react";

export function ScanHub() {
  const [url, setUrl] = useState("https://github.com/octocat/Hello-World");
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [leaks, setLeaks] = useState<Leak[]>([]);
  const [metrics, setMetrics] = useState<ScanMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const zipInput = useRef<HTMLInputElement>(null);

  const log: Logger = useCallback((line, level = "info") => {
    const prefix =
      level === "error" ? "✗ " : level === "warn" ? "! " : level === "success" ? "✓ " : "";
    setLines((prev) => [...prev, prefix + line]);
  }, []);

  const runScan = useCallback(
    async (fn: (log: Logger) => Promise<ReturnType<typeof scanLooseFiles> extends Promise<infer R> ? R : never>) => {
      if (running) return;
      setRunning(true);
      setLines([]);
      setLeaks([]);
      setMetrics(null);
      setError(null);
      log("Initializing scanner engine...");
      try {
        const out = await fn(log);
        setMetrics(out.metrics);
        if (out.ok) {
          setLeaks(out.leaks);
          if (out.leaks.length === 0) toast.success("All clear — no secrets detected 🌿");
          else toast.success(`Scan complete — ${out.leaks.length} secret(s) surfaced`);
        } else {
          setError(out.message);
          setLeaks([]);
          toast.error(out.message);
        }
      } catch (err) {
        const msg = (err as Error).message || "Unknown scanner error";
        log(msg, "error");
        setError(msg);
        toast.error(msg);
      } finally {
        setRunning(false);
      }
    },
    [running, log],
  );

  const startUrlScan = () => {
    if (!url.trim()) {
      toast.error("Enter a GitHub URL first");
      return;
    }
    setPendingFiles([]);
    runScan((l) => scanGithubUrl(url, l));
  };

  const startFileScan = () => {
    if (pendingFiles.length === 0) return;
    const single = pendingFiles[0];
    if (pendingFiles.length === 1 && /\.zip$/i.test(single.name)) {
      runScan((l) => scanZip(single, l));
    } else {
      runScan((l) => scanLooseFiles(pendingFiles, l));
    }
  };

  const onUpload = () => fileInput.current?.click();
  const onZipUpload = () => zipInput.current?.click();
  const onFilesPicked = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const arr = Array.from(list);
    setPendingFiles(arr);
    toast.success(`${arr.length} file(s) staged — press Start Scan`);
  };
  const clearFiles = () => {
    setPendingFiles([]);
    if (fileInput.current) fileInput.current.value = "";
    if (zipInput.current) zipInput.current.value = "";
  };

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

  const hasStaged = pendingFiles.length > 0;
  const stagedIsZip = pendingFiles.length === 1 && /\.zip$/i.test(pendingFiles[0]?.name || "");

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <Toaster position="bottom-right" />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 40% at 85% 0%, oklch(0.92 0.06 25 / 0.5), transparent 60%), radial-gradient(50% 50% at 0% 30%, oklch(0.9 0.07 155 / 0.4), transparent 60%), radial-gradient(40% 40% at 100% 100%, oklch(0.9 0.07 145 / 0.35), transparent 60%)",
        }}
      />
      <Leaf aria-hidden className="absolute -top-6 -left-6 w-56 h-56 text-sage/25 -rotate-12" strokeWidth={0.6} />
      <Leaf aria-hidden className="absolute top-40 right-0 w-72 h-72 text-leaf/20 rotate-45" strokeWidth={0.5} />
      <Leaf aria-hidden className="absolute bottom-10 left-1/4 w-64 h-64 text-sage/15 -rotate-45" strokeWidth={0.5} />

      <header className="relative">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[oklch(0.75_0.11_155)] to-[oklch(0.55_0.13_150)] flex items-center justify-center soft-shadow">
              <Leaf className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-xl font-display font-semibold tracking-tight">
                Verdant Sentinel — Git Secret Scanner &amp; Leak Detector
              </h1>
              <p className="text-xs text-muted-foreground">a calm secret scanner for your git garden</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 pb-16 space-y-10">
        <section className="rounded-[2rem] bg-card/80 backdrop-blur-sm border border-border/40 soft-shadow p-8 md:p-10">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-sage-deep mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Scan Hub
          </div>
          <h2 className="font-display text-3xl md:text-4xl leading-tight max-w-2xl">
            Grow safer repos. <span className="text-sage-deep italic">Uproot</span> leaked secrets before they bloom.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl text-sm">
            Paste a public GitHub URL to clone server-side, or drop a ZIP / loose files to scan in your browser. Same
            engine, same signatures.
          </p>

          {/* URL row */}
          <div className="mt-8 grid md:grid-cols-[1fr_auto] gap-3">
            <div className="relative">
              <GitBranch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                aria-label="GitHub repository URL"
                placeholder="https://github.com/org/repo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-11 h-12 rounded-full bg-white/80 border-border/50 font-mono text-sm"
              />
            </div>
            <Button
              onClick={startUrlScan}
              disabled={running}
              className="h-12 px-6 rounded-full bg-gradient-to-r from-[oklch(0.65_0.13_155)] to-[oklch(0.55_0.13_145)] hover:opacity-90 text-white soft-shadow"
            >
              <Play className="w-4 h-4 mr-2" />
              {running ? "Scanning..." : "Clone & Scan"}
            </Button>
          </div>

          {/* Upload row */}
          <div className="mt-3 flex flex-wrap gap-3">
            <Button variant="outline" onClick={onZipUpload} className="h-11 rounded-full border-border/50 bg-white/70 hover:bg-white">
              <Upload className="w-4 h-4 mr-2" /> Upload ZIP
            </Button>
            <Button variant="outline" onClick={onUpload} className="h-11 rounded-full border-border/50 bg-white/70 hover:bg-white">
              <Upload className="w-4 h-4 mr-2" /> Upload files
            </Button>
            {hasStaged && (
              <Button
                onClick={startFileScan}
                disabled={running}
                className="h-11 px-5 rounded-full bg-sage-deep hover:bg-[oklch(0.5_0.11_155)] text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Scan {stagedIsZip ? "ZIP" : `${pendingFiles.length} file(s)`}
              </Button>
            )}
            <input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => onFilesPicked(e.target.files)} />
            <input ref={zipInput} type="file" accept=".zip,application/zip" className="hidden" onChange={(e) => onFilesPicked(e.target.files)} />
          </div>

          {hasStaged && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono truncate max-w-md">
                {pendingFiles.slice(0, 3).map((f) => f.name).join(", ")}
                {pendingFiles.length > 3 ? ` +${pendingFiles.length - 3} more` : ""}
              </span>
              <button onClick={clearFiles} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 hover:bg-blush/40">
                <X className="w-3 h-3" /> clear
              </button>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[oklch(0.85_0.12_25)]/50 bg-[oklch(0.96_0.04_25)] p-4 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 text-[oklch(0.5_0.18_25)]" />
              <div>
                <div className="font-medium text-[oklch(0.4_0.15_25)]">Scan halted</div>
                <div className="text-[oklch(0.42_0.12_25)]/90 mt-0.5">{error}</div>
              </div>
            </div>
          )}
        </section>

        <Console lines={lines} running={running} />

        <MetricsBar metrics={metrics} />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Triage Garden</h2>
            <span className="text-xs text-muted-foreground">live counts update as findings evolve</span>
          </div>
          <StatCards
            filesScanned={metrics?.filesScanned ?? 0}
            leaks={leaks}
            falsePositives={metrics?.falsePositives ?? 0}
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Detected Leaks</h2>
            <span className="text-xs text-muted-foreground">Verify runs a TruffleHog-style live probe (mocked)</span>
          </div>
          <LeakTable leaks={leaks} onFix={onFix} onIgnore={onIgnore} onVerify={onVerify} />
        </section>
      </main>
    </div>
  );
}
