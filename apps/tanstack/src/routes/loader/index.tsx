import { BenchmarkPage } from "@benchmark/workload";
import { createFileRoute } from "@tanstack/react-router";
import { loadBenchmarkDataFromServer } from "../../server-functions";

export const Route = createFileRoute("/loader/")({
  loader: () => loadBenchmarkDataFromServer({ data: 50 }),
  component: Page,
});

function Page() {
  return <BenchmarkPage data={Route.useLoaderData()} scenario="loader" />;
}
