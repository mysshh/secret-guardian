export type Severity = "Critical" | "Warning";
export type LiveStatus = "Unknown" | "Active Threat" | "Inactive/Mock" | "Checking";

export interface Leak {
  id: string;
  file: string;
  line: number;
  author: string;
  severity: Severity;
  type: string;
  masked: string;
  liveStatus: LiveStatus;
  fixed: boolean;
  ignored: boolean;
  isFalsePositive?: boolean;
}

export const SCAN_STEPS = [
  "Initializing scanner engine...",
  "Cloning repository into sandbox...",
  "Enumerating commit history (depth: full)...",
  "Checking commit history for staged blobs...",
  "Running regex signatures across 42 detectors...",
  "Analyzing string entropy to reduce false positives...",
  "Cross-referencing against allowlist...",
  "Compiling triage report...",
  "Scan complete.",
];

export const MOCK_LEAKS: Leak[] = [
  {
    id: "l1",
    file: "src/config/firebase.ts",
    line: 12,
    author: "alice@team.dev",
    severity: "Critical",
    type: "Google API Key",
    masked: "AIzaSyB2f9...••••••••",
    liveStatus: "Unknown",
    fixed: false,
    ignored: false,
  },
  {
    id: "l2",
    file: ".env.backup",
    line: 3,
    author: "bob@team.dev",
    severity: "Critical",
    type: "AWS Access Key",
    masked: "AKIAIOSF...••••••••",
    liveStatus: "Unknown",
    fixed: false,
    ignored: false,
  },
  {
    id: "l3",
    file: "scripts/deploy.sh",
    line: 47,
    author: "carol@team.dev",
    severity: "Warning",
    type: "Slack Webhook",
    masked: "https://hooks.slack.com/T0••••/B0••••",
    liveStatus: "Unknown",
    fixed: false,
    ignored: false,
  },
  {
    id: "l4",
    file: "tests/fixtures/sample.json",
    line: 8,
    author: "dan@team.dev",
    severity: "Warning",
    type: "Stripe Test Key",
    masked: "sk_test_4eC3...••••",
    liveStatus: "Unknown",
    fixed: false,
    ignored: false,
  },
  {
    id: "l5",
    file: "README.md",
    line: 102,
    author: "alice@team.dev",
    severity: "Critical",
    type: "GitHub PAT",
    masked: "ghp_1a2b3c...••••••••",
    liveStatus: "Unknown",
    fixed: false,
    ignored: false,
  },
  {
    id: "l6",
    file: "src/utils/legacy.js",
    line: 219,
    author: "eve@team.dev",
    severity: "Warning",
    type: "Generic High-Entropy String",
    masked: "x7Kq9pLm...••••",
    liveStatus: "Unknown",
    fixed: false,
    ignored: false,
  },
];
