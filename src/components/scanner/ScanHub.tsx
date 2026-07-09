import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SCAN_STEPS, type Leak } from "@/lib/mock-data";
import { scanFiles } from "@/lib/scanner";
import { Console } from "./Console";
import { StatCards } from "./StatCards";
import { LeakTable } from "./LeakTable";
import { toast, Toaster } from "sonner";
import { GitBranch, Upload, Play, Leaf, Sparkles, X } from "lucide-react";

type Mode = "precommit" | "full";

export function ScanHub() {
  const [url, setUrl] = useState("https://github.com/acme/payments-service");
  const [mode, setMode] = useState<Mode>("full");
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [leaks, setLeaks] = useState<Leak[]>([]);
  const [filesScanned, setFilesScanned] = useState(0);
  const [falsePositives, setFalsePositives] = useState(0);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const runSteps = (steps: string[], onDone: () => void) => {
    steps.forEach((step, i) => {
      const t = setTimeout(() => {
        setLines((prev) => [...prev, step]);
        if (i === steps.length - 1) onDone();
      }, 380 * (i + 1));
      timers.current.push(t);
    });
  };

  const startScan = useCallback(async () => {
    if (running) return;
    timers.current.forEach(clearTimeout);
    setRunning(true);
    setLines([]);
    setLeaks([]);
    setFilesScanned(0);
    setFalsePositives(0);

    const steps =
      mode === "precommit" ? SCAN_STEPS.slice(0, 4).concat(SCAN_STEPS.slice(5)) : SCAN_STEPS;

    if (pendingFiles.length > 0) {
      const result = await scanFiles(pendingFiles);
      runSteps(
        [
          `Reading ${pendingFiles.length} uploaded file(s)...`,
          ...steps.slice(2, -1),
          `Scanned ${result.filesScanned} text file(s), ${(result.bytesScanned / 1024).toFixed(1)} KB.`,
          "Scan complete.",
        ],
        () => {
          setLeaks(result.leaks);
          setFilesScanned(result.filesScanned);
          setFalsePositives(result.falsePositives);
          setRunning(false);
          if (result.leaks.length === 0) toast.success("All clear — no secrets detected 🌿");
          else toast.success(`Scan complete — ${result.leaks.length} secret(s) surfaced`);
        },
      );
      return;
    }

    runSteps(steps, () => {
      setLeaks([]);
      setFilesScanned(0);
      setFalsePositives(0);
      setRunning(false);
      toast("Remote clone runs server-side. Upload files here to scan locally.", { duration: 5000 });
    });
  }, [mode, running, pendingFiles]);

  const onUpload = () => fileInput.current?.click();
  const onFilesPicked = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const arr = Array.from(list);
    setPendingFiles(arr);
    toast.success(`${arr.length} file(s) staged — press Start Scan`);
  };
  const clearFiles = () => {
    setPendingFiles([]);
    if (fileInput.current) fileInput.current.value = "";
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

  

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <Toaster position="bottom-right" />

      {/* Ambient botanical background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 40% at 85% 0%, oklch(0.92 0.06 25 / 0.5), transparent 60%), radial-gradient(50% 50% at 0% 30%, oklch(0.9 0.07 155 / 0.4), transparent 60%), radial-gradient(40% 40% at 100% 100%, oklch(0.9 0.07 145 / 0.35), transparent 60%)",
        }}
      />
      <Leaf
        aria-hidden
        className="absolute -top-6 -left-6 w-56 h-56 text-sage/25 -rotate-12"
        strokeWidth={0.6}
      />
      <Leaf
        aria-hidden
        className="absolute top-40 right-0 w-72 h-72 text-leaf/20 rotate-45"
        strokeWidth={0.5}
      />
      <Leaf
        aria-hidden
        className="absolute bottom-10 left-1/4 w-64 h-64 text-sage/15 -rotate-45"
        strokeWidth={0.5}
      />

      {/* Header */}
      <header className="relative">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[oklch(0.75_0.11_155)] to-[oklch(0.55_0.13_150)] flex items-center justify-center soft-shadow">
              <Leaf className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-xl font-display font-semibold tracking-tight">
                Verdant Sentinel
              </h1>
              <p className="text-xs text-muted-foreground">
                a calm secret scanner for your git garden
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-white/60 backdrop-blur px-3 py-1.5 rounded-full border border-border/40">
            <span className="w-1.5 h-1.5 rounded-full bg-sage" />
            v1.0 · mock-mode
          </span>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 pb-16 space-y-10">
        {/* Hero + Scan Hub */}
        <section className="rounded-[2rem] bg-card/80 backdrop-blur-sm border border-border/40 soft-shadow p-8 md:p-10">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-sage-deep mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Scan Hub
          </div>
          <h2 className="font-display text-3xl md:text-4xl leading-tight max-w-2xl">
            Grow safer repos. <span className="text-sage-deep italic">Uproot</span> leaked
            secrets before they bloom.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl text-sm">
            Point Sentinel at a repository or drop in files. It quietly checks
            history, entropy, and known signatures — then hands you a tidy triage.
          </p>

          <div className="mt-8 grid md:grid-cols-[1fr_auto] gap-3">
            <div className="relative">
              <GitBranch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="https://github.com/org/repo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-11 h-12 rounded-full bg-white/80 border-border/50 font-mono text-sm"
              />
            </div>
            <Button
              variant="outline"
              onClick={onUpload}
              className="h-12 rounded-full border-border/50 bg-white/70 hover:bg-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              {pendingFiles.length > 0 ? `${pendingFiles.length} file(s) staged` : "Upload files"}
            </Button>
            <input
              ref={fileInput}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onFilesPicked(e.target.files)}
            />
          </div>

          {pendingFiles.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono truncate max-w-md">
                {pendingFiles.slice(0, 3).map((f) => f.name).join(", ")}
                {pendingFiles.length > 3 ? ` +${pendingFiles.length - 3} more` : ""}
              </span>
              <button
                onClick={clearFiles}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 hover:bg-blush/40"
              >
                <X className="w-3 h-3" /> clear
              </button>
            </div>
          )}


          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="inline-flex rounded-full bg-[oklch(0.94_0.02_90)] p-1 border border-border/40">
              <button
                onClick={() => setMode("precommit")}
                className={`px-4 py-2 text-sm rounded-full transition-all ${
                  mode === "precommit"
                    ? "bg-white text-sage-deep font-medium soft-shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pre-Commit Hook
              </button>
              <button
                onClick={() => setMode("full")}
                className={`px-4 py-2 text-sm rounded-full transition-all ${
                  mode === "full"
                    ? "bg-white text-sage-deep font-medium soft-shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Full Git History
              </button>
            </div>

            <Button
              onClick={startScan}
              disabled={running}
              className="ml-auto h-12 px-6 rounded-full bg-gradient-to-r from-[oklch(0.65_0.13_155)] to-[oklch(0.55_0.13_145)] hover:opacity-90 text-white soft-shadow"
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
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Triage Garden</h2>
            <span className="text-xs text-muted-foreground">
              live counts update as findings evolve
            </span>
          </div>
          <StatCards filesScanned={filesScanned} leaks={leaks} falsePositives={falsePositives} />
        </section>

        {/* Leak Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Detected Leaks</h2>
            <span className="text-xs text-muted-foreground">
              Verify runs a TruffleHog-style live probe (mocked)
            </span>
          </div>
          <LeakTable leaks={leaks} onFix={onFix} onIgnore={onIgnore} onVerify={onVerify} />
        </section>
      </main>
    </div>
  );
}
