import type { Leak, Severity } from "./mock-data";

export interface FileSource {
  path: string;
  content: string;
  size: number;
}

interface Detector {
  type: string;
  severity: Severity;
  regex: RegExp;
}

const DETECTORS: Detector[] = [
  { type: "AWS Access Key", severity: "Critical", regex: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { type: "Google API Key", severity: "Critical", regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { type: "GitHub PAT", severity: "Critical", regex: /\bghp_[0-9A-Za-z]{36}\b/g },
  { type: "GitHub Fine-Grained PAT", severity: "Critical", regex: /\bgithub_pat_[0-9A-Za-z_]{22,}\b/g },
  { type: "Slack Token", severity: "Critical", regex: /\bxox[abpr]-[0-9A-Za-z-]{10,}\b/g },
  { type: "Slack Webhook", severity: "Warning", regex: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/g },
  { type: "Stripe Live Key", severity: "Critical", regex: /\bsk_live_[0-9A-Za-z]{16,}\b/g },
  { type: "Stripe Test Key", severity: "Warning", regex: /\bsk_test_[0-9A-Za-z]{16,}\b/g },
  { type: "OpenAI API Key", severity: "Critical", regex: /\bsk-[A-Za-z0-9]{20,}T3BlbkFJ[A-Za-z0-9]{20,}\b/g },
  { type: "Private Key Block", severity: "Critical", regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g },
  { type: "JWT Token", severity: "Warning", regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
];

const TEXT_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|env|sh|bash|zsh|yml|yaml|toml|ini|cfg|conf|md|txt|py|rb|go|rs|java|kt|swift|php|cs|xml|html|css|sql|pem|key)$/i;
const ENV_LIKE = /(^|\/)\.env(\..+)?$|(^|\/)config\.(json|ya?ml)$/i;
const MAX_FILE_BYTES = 512 * 1024;

export function isScannable(path: string, size: number, mime = ""): boolean {
  if (size > MAX_FILE_BYTES) return false;
  return TEXT_EXT.test(path) || ENV_LIKE.test(path) || mime.startsWith("text/");
}

function mask(s: string) {
  if (s.length <= 10) return s.slice(0, 3) + "•".repeat(Math.max(1, s.length - 3));
  return s.slice(0, 6) + "…" + "•".repeat(8);
}

function shannonEntropy(s: string) {
  const freq: Record<string, number> = {};
  for (const c of s) freq[c] = (freq[c] || 0) + 1;
  let h = 0;
  for (const k in freq) {
    const p = freq[k] / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

export interface DetectionResult {
  leaks: Leak[];
  falsePositives: number;
}

export function detect(sources: FileSource[], author = "local"): DetectionResult {
  const leaks: Leak[] = [];
  let falsePositives = 0;
  let idc = 0;

  for (const src of sources) {
    const lines = src.content.split(/\r?\n/);
    const seen = new Set<string>();

    for (const d of DETECTORS) {
      d.regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = d.regex.exec(src.content)) !== null) {
        const raw = m[0];
        const key = d.type + ":" + raw;
        if (seen.has(key)) continue;
        seen.add(key);

        const tail = raw.slice(-20);
        if (shannonEntropy(tail) < 2.5) {
          falsePositives++;
          continue;
        }

        let lineNo = 1;
        let acc = 0;
        for (let i = 0; i < lines.length; i++) {
          acc += lines[i].length + 1;
          if (acc > m.index) {
            lineNo = i + 1;
            break;
          }
        }

        leaks.push({
          id: "f" + ++idc,
          file: src.path,
          line: lineNo,
          author,
          severity: d.severity,
          type: d.type,
          masked: mask(raw),
          liveStatus: "Unknown",
          fixed: false,
          ignored: false,
        });
      }
    }
  }

  return { leaks, falsePositives };
}
