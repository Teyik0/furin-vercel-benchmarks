import { BenchmarkPage, createBenchmarkData } from "@benchmark/workload";
import Link from "next/link";
import { BENCHMARK_NONCE } from "../.benchmark-nonce";
export const dynamic = "force-dynamic";
export default function Page() {
  return <><meta content={BENCHMARK_NONCE} name="benchmark-nonce" /><Link data-nav="loader" href="/loader">Loader</Link><BenchmarkPage data={createBenchmarkData()} scenario="dynamic" /></>;
}
