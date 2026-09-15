import { BenchmarkPage, createBenchmarkData } from "@benchmark/workload";
import { Link, createFileRoute } from "@tanstack/react-router";
import { BENCHMARK_NONCE } from "../.benchmark-nonce";
export const Route = createFileRoute("/dynamic")({ component: () => <><meta content={BENCHMARK_NONCE} name="benchmark-nonce" /><Link data-nav="loader" to="/loader">Loader</Link><BenchmarkPage data={createBenchmarkData()} scenario="dynamic" /></> });
