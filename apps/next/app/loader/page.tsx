import { BenchmarkPage, loadBenchmarkData } from "@benchmark/workload";
export const dynamic = "force-dynamic";
export default async function Page() {
  return <BenchmarkPage data={await loadBenchmarkData(50)} scenario="loader" />;
}
