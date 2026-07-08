import { useEffect, useRef } from "react";

interface Props {
  lines: string[];
  running: boolean;
}

export function Console({ lines, running }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);

  return (
    <div className="rounded-3xl overflow-hidden soft-shadow border border-border/60 bg-[oklch(0.22_0.03_155)]">
      <div className="flex items-center gap-2 px-5 py-3 bg-[oklch(0.18_0.03_155)] border-b border-white/5">
        <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.75_0.12_25)]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.85_0.1_85)]" />
        <span className="w-2.5 h-2.5 rounded-full bg-sage" />
        <span className="ml-3 text-xs text-white/50 font-mono tracking-wide">
          sentinel@garden:~
        </span>
      </div>
      <div
        ref={ref}
        className="h-64 overflow-y-auto p-5 font-mono text-sm text-sage space-y-1.5"
      >
        {lines.length === 0 && (
          <div className="text-white/40">$ awaiting scan command… 🌿</div>
        )}
        {lines.map((l, i) => (
          <div key={i} className="animate-fade-in">
            <span className="text-white/30">›</span>{" "}
            <span className={l.includes("complete") ? "text-[oklch(0.85_0.15_145)] font-semibold" : ""}>
              {l}
            </span>
          </div>
        ))}
        {running && (
          <div>
            <span className="inline-block w-2 h-4 bg-sage animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
