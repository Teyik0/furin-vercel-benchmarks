import { loadBenchmarkData } from "@benchmark/workload";
import { createServerFn } from "@tanstack/react-start";

export const loadBenchmarkDataFromServer = createServerFn({ method: "GET" })
  .validator((delayMs: number) => delayMs)
  .handler(({ data: delayMs }) => loadBenchmarkData(delayMs));
