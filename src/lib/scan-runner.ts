import JSZip from "jszip";
import { detect, isScannable, type FileSource } from "./detection-engine";
import type { Leak } from "./mock-data";

export type LogLevel = "info" | "warn" | "error" | "success";
export type Logger = (line: string, level?: LogLevel) => void;

export interface ScanMetrics {
  filesDiscovered: number;
  filesScanned: number;
  bytesScanned: number;
  findings: number;
  falsePositives: number;
  durationMs: number;
}

export interface ScanResult {
  ok: true;
  leaks: Leak[];
  metrics: ScanMetrics;
}

export interface ScanFailure {
  ok: false;
  stage: "clone" | "extract" | "discover" | "scan";
  message: string;
  metrics: ScanMetrics;
}

export type ScanOutcome = ScanResult | ScanFailure;

function emptyMetrics(): ScanMetrics {
  return {
    filesDiscovered: 0,
    filesScanned: 0,
    bytesScanned: 0,
    findings: 0,
    falsePositives: 0,
    durationMs: 0,
  };
}

async function runEngine(
  sources: FileSource[],
  discovered: number,
  started: number,
  log: Logger,
  author: string,
): Promise<ScanOutcome> {
  const metrics = emptyMetrics();
  metrics.filesDiscovered = discovered;
  metrics.filesScanned = sources.length;
  metrics.bytesScanned = sources.reduce((n, s) => n + s.size, 0);

  if (sources.length === 0) {
    metrics.durationMs = performance.now() - started;
    log("No scannable text files were found — nothing to analyze.", "warn");
    return { ok: false, stage: "discover", message: "No files scanned", metrics };
  }

  log(`Detection engine: analyzing ${sources.length} file(s) (${(metrics.bytesScanned / 1024).toFixed(1)} KB)...`);
  const { leaks, falsePositives } = detect(sources, author);
  metrics.findings = leaks.length;
  metrics.falsePositives = falsePositives;
  metrics.durationMs = performance.now() - started;

  log(
    `Engine complete: ${leaks.length} finding(s), ${falsePositives} filtered as noise, in ${metrics.durationMs.toFixed(0)}ms.`,
    "success",
  );
  return { ok: true, leaks, metrics };
}

/** Scan a set of loose uploaded files. */
export async function scanLooseFiles(files: File[], log: Logger): Promise<ScanOutcome> {
  const started = performance.now();
  log(`File discovery: received ${files.length} file(s) from picker.`);

  const sources: FileSource[] = [];
  for (const file of files) {
    const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    if (!isScannable(path, file.size, file.type)) {
      log(`  skip: ${path} (binary or >512KB)`);
      continue;
    }
    try {
      const content = await file.text();
      sources.push({ path, content, size: file.size });
    } catch (err) {
      log(`  read-fail: ${path} — ${(err as Error).message}`, "warn");
    }
  }
  log(`File discovery: ${sources.length}/${files.length} file(s) are scannable text.`);
  return runEngine(sources, files.length, started, log, "local (uploaded)");
}

/** Extract a ZIP client-side and scan its text contents. */
export async function scanZip(file: File, log: Logger): Promise<ScanOutcome> {
  const started = performance.now();
  const metrics = emptyMetrics();

  log(`ZIP extraction: opening "${file.name}" (${(file.size / 1024).toFixed(1)} KB)...`);
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(await file.arrayBuffer());
  } catch (err) {
    metrics.durationMs = performance.now() - started;
    const msg = `Failed to open ZIP: ${(err as Error).message}`;
    log(msg, "error");
    return { ok: false, stage: "extract", message: msg, metrics };
  }

  const entries = Object.values(zip.files).filter((e) => !e.dir);
  log(`ZIP extraction: ${entries.length} entries found.`);

  const sources: FileSource[] = [];
  for (const entry of entries) {
    const size = ((entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize) ?? 0;
    if (!isScannable(entry.name, size)) continue;
    try {
      const content = await entry.async("string");
      sources.push({ path: entry.name, content, size: content.length });
    } catch (err) {
      log(`  extract-fail: ${entry.name} — ${(err as Error).message}`, "warn");
    }
  }
  log(`File discovery: ${sources.length}/${entries.length} entries are scannable text.`);
  return runEngine(sources, entries.length, started, log, `zip:${file.name}`);
}

function parseGithubUrl(url: string): { owner: string; repo: string; ref?: string } | null {
  try {
    const u = new URL(url.trim());
    if (!/github\.com$/i.test(u.hostname)) return null;
    const parts = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (parts.length < 2) return null;
    const [owner, repoRaw, kind, ...rest] = parts;
    const repo = repoRaw.replace(/\.git$/, "");
    const ref = kind === "tree" && rest.length ? rest.join("/") : undefined;
    return { owner, repo, ref };
  } catch {
    return null;
  }
}

/** Clone a public GitHub repo via server-side zipball fetch, then scan. */
export async function scanGithubUrl(url: string, log: Logger): Promise<ScanOutcome> {
  const started = performance.now();
  const metrics = emptyMetrics();

  const parsed = parseGithubUrl(url);
  if (!parsed) {
    metrics.durationMs = performance.now() - started;
    const msg = "Invalid GitHub URL. Expected https://github.com/owner/repo";
    log(msg, "error");
    return { ok: false, stage: "clone", message: msg, metrics };
  }

  log(`Cloning ${parsed.owner}/${parsed.repo}${parsed.ref ? `@${parsed.ref}` : ""} via server zipball...`);
  const qs = new URLSearchParams({ owner: parsed.owner, repo: parsed.repo });
  if (parsed.ref) qs.set("ref", parsed.ref);

  let resp: Response;
  try {
    resp = await fetch(`/api/public/fetch-repo?${qs.toString()}`);
  } catch (err) {
    metrics.durationMs = performance.now() - started;
    const msg = `Clone failed (network): ${(err as Error).message}`;
    log(msg, "error");
    return { ok: false, stage: "clone", message: msg, metrics };
  }

  if (!resp.ok) {
    metrics.durationMs = performance.now() - started;
    const detail = await resp.text().catch(() => resp.statusText);
    const msg = `Clone failed (${resp.status}): ${detail.slice(0, 200)}`;
    log(msg, "error");
    return { ok: false, stage: "clone", message: msg, metrics };
  }

  const buf = await resp.arrayBuffer();
  log(`Clone succeeded: received ${(buf.byteLength / 1024).toFixed(1)} KB zipball.`, "success");

  log("ZIP extraction: unpacking repository archive...");
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buf);
  } catch (err) {
    metrics.durationMs = performance.now() - started;
    const msg = `Extraction failed: ${(err as Error).message}`;
    log(msg, "error");
    return { ok: false, stage: "extract", message: msg, metrics };
  }

  const entries = Object.values(zip.files).filter((e) => !e.dir);
  log(`Repository contains ${entries.length} file(s).`);

  const sources: FileSource[] = [];
  for (const entry of entries) {
    // strip leading "<repo>-<sha>/" prefix from github zipballs
    const rel = entry.name.replace(/^[^/]+\//, "");
    if (!rel) continue;
    const size = ((entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize) ?? 0;
    if (!isScannable(rel, size)) continue;
    try {
      const content = await entry.async("string");
      sources.push({ path: rel, content, size: content.length });
    } catch (err) {
      log(`  extract-fail: ${rel} — ${(err as Error).message}`, "warn");
    }
  }
  log(`File discovery: ${sources.length}/${entries.length} file(s) are scannable text.`);
  return runEngine(sources, entries.length, started, log, `${parsed.owner}/${parsed.repo}`);
}
