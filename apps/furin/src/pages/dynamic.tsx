import { BenchmarkPage, createBenchmarkData } from "@benchmark/workload";
import { defineRoute } from "@teyik0/furin";
import { Link } from "@teyik0/furin/link";
import { BENCHMARK_NONCE } from "../.benchmark-nonce";
export const route = defineRoute("/dynamic").config({ mode: "ssr" }).page(() => (
  <><meta content={BENCHMARK_NONCE} name="benchmark-nonce" /><Link data-nav="loader" to="/loader">Loader</Link><BenchmarkPage data={createBenchmarkData()} scenario="dynamic" /></>
));
