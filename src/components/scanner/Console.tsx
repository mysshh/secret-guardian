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
    <div className="rounded-lg border border-border bg-[#0b1020] shadow-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#0f1530] border-b border-border">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-xs text-slate-400 font-mono">sentinel@scan:~</span>
      </div>
      <div
        ref={ref}
        className="h-64 overflow-y-auto p-4 font-mono text-sm text-emerald-300 space-y-1"
      >
        {lines.length === 0 && (
          <div className="text-slate-500">$ awaiting scan command...</div>
        )}
        {lines.map((l, i) => (
          <div key={i} className="animate-fade-in">
            <span className="text-slate-500">$</span>{" "}
            <span className={l.includes("complete") ? "text-emerald-400 font-semibold" : ""}>
              {l}
            </span>
          </div>
        ))}
        {running && (
          <div className="text-emerald-400">
            <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
