import { BenchmarkPage } from "@benchmark/workload";
import { createFileRoute } from "@tanstack/react-router";
import { loadBenchmarkDataFromServer } from "../server-functions";

export const Route = createFileRoute("/isr")({
  loader: () => loadBenchmarkDataFromServer({ data: 50 }),
  headers: () => ({
    "cache-control": "public, s-maxage=300, stale-while-revalidate=300",
  }),
  component: Page,
});

function Page() {
  return <BenchmarkPage data={Route.useLoaderData()} scenario="isr" />;
}
