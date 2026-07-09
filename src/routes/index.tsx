import { createFileRoute } from "@tanstack/react-router";
import { ScanHub } from "@/components/scanner/ScanHub";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GitLeak Sentinel — Git Secret Scanner & Leak Detector" },
      {
        name: "description",
        content:
          "Scan Git repositories for leaked API keys, tokens, and secrets. Entropy analysis, live verification, and auto-remediation.",
      },
      { property: "og:title", content: "GitLeak Sentinel — Git Secret Scanner & Leak Detector" },
      {
        property: "og:description",
        content: "Scan Git repositories for leaked API keys, tokens, and secrets. Entropy analysis, live verification, and auto-remediation.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <ScanHub />;
}
