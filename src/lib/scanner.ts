import type { Leak, Severity } from "./mock-data";

interface Detector {
  type: string;
  severity: Severity;
  regex: RegExp;
}

// Signature-based detectors. Tuned to avoid matching generic prose.
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

// Text-file extensions we're willing to peek at.
const TEXT_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|env|sh|bash|zsh|yml|yaml|toml|ini|cfg|conf|md|txt|py|rb|go|rs|java|kt|swift|php|cs|xml|html|css|sql|pem|key)$/i;
const ENV_LIKE = /(^|\/)\.env(\..+)?$|(^|\/)config\.(json|ya?ml)$/i;

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

export interface ScanOutcome {
  leaks: Leak[];
  filesScanned: number;
  bytesScanned: number;
  falsePositives: number;
}

export async function scanFiles(files: File[]): Promise<ScanOutcome> {
  const leaks: Leak[] = [];
  let filesScanned = 0;
  let bytesScanned = 0;
  let falsePositives = 0;
  let idc = 0;

  for (const file of files) {
    const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const isText = TEXT_EXT.test(path) || ENV_LIKE.test(path) || file.type.startsWith("text/");
    if (!isText) continue;
    if (file.size > 512 * 1024) continue; // skip big blobs
    filesScanned++;
    bytesScanned += file.size;

    let text: string;
    try {
      text = await file.text();
    } catch {
      continue;
    }

    const lines = text.split(/\r?\n/);
    const seen = new Set<string>();

    for (const d of DETECTORS) {
      d.regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = d.regex.exec(text)) !== null) {
        const raw = m[0];
        const key = d.type + ":" + raw;
        if (seen.has(key)) continue;
        seen.add(key);

        // entropy check on tail of the match — filters obvious placeholders
        const tail = raw.slice(-20);
        if (shannonEntropy(tail) < 2.5) {
          falsePositives++;
          continue;
        }

        // find the line number of the first occurrence
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
          id: "u" + ++idc,
          file: path,
          line: lineNo,
          author: "local (uploaded)",
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

  return { leaks, filesScanned, bytesScanned, falsePositives };
}
