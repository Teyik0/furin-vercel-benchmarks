import { BenchmarkPage, createBenchmarkData } from "@benchmark/workload";
import { defineRoute } from "@teyik0/furin";
import { Link } from "@teyik0/furin/link";
import { BENCHMARK_NONCE } from "../.benchmark-nonce";
import { route as rootRoute } from "./root";
export const route = defineRoute().config({ layout: rootRoute, mode: "ssr" }).page(() => (
  <><meta content={BENCHMARK_NONCE} name="benchmark-nonce" /><Link data-nav="loader" to="/loader">Loader</Link><BenchmarkPage data={createBenchmarkData()} scenario="dynamic" /></>
));
