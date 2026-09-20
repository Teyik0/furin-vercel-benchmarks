import { BenchmarkPage, loadBenchmarkData } from "@benchmark/workload";
import { defineRoute } from "@teyik0/furin";
import { readBenchmark } from "../benchmark-props";
import { route as rootRoute } from "./root";
export const route = defineRoute().config({ layout: rootRoute, mode: "ssr" })
  .loader(async () => ({ benchmark: await loadBenchmarkData(50) }))
  .page((props) => <BenchmarkPage data={readBenchmark(props)} scenario="loader" />);
