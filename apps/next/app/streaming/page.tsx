import { BenchmarkPage, loadBenchmarkData } from "@benchmark/workload";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
async function DeferredTree() {
  return <BenchmarkPage data={await loadBenchmarkData(200)} scenario="streaming" />;
}
export default function Page() {
  return <Suspense fallback={<main data-benchmark-shell="streaming">Loading</main>}><DeferredTree /></Suspense>;
}
