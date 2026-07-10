import { createFileRoute } from "@tanstack/react-router";
import { ScanHub } from "@/components/scanner/ScanHub";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <ScanHub />;
}
