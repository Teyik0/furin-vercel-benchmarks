import { BenchmarkPage, loadBenchmarkData } from "@benchmark/workload";
import { defineRoute } from "@teyik0/furin";
export const route = defineRoute("/isr").config({ mode: "isr", revalidate: 300 })
  .loader(async () => ({ benchmark: await loadBenchmarkData(50) }))
  .page(({ benchmark }) => <BenchmarkPage data={benchmark} scenario="isr" />);
