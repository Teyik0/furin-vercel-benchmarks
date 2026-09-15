import { BenchmarkPage, loadBenchmarkData } from "@benchmark/workload";
import { defineRoute } from "@teyik0/furin";
import { route as rootRoute } from "./root";
export const route = defineRoute().config({ layout: rootRoute, mode: "ssr" })
  .loader(async () => ({ benchmark: await loadBenchmarkData(50) }))
  .page(({ data }) => <BenchmarkPage data={data.benchmark} scenario="loader" />);
