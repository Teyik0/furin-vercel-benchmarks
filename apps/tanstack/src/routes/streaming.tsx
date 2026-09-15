import { BenchmarkPage, type BenchmarkData } from "@benchmark/workload";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, use } from "react";
import { loadBenchmarkDataFromServer } from "../server-functions";

export const Route = createFileRoute("/streaming")({
  loader: () => ({ data: loadBenchmarkDataFromServer({ data: 200 }) }),
  component: Page,
});

function DeferredTree({ data }: { data: Promise<BenchmarkData> }) {
  return <BenchmarkPage data={use(data)} scenario="streaming" />;
}

function Page() {
  const { data } = Route.useLoaderData();
  return (
    <Suspense fallback={<main data-benchmark-shell="streaming">Loading</main>}>
      <DeferredTree data={data} />
    </Suspense>
  );
}
