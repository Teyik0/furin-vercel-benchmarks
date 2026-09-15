import { BenchmarkPage, loadBenchmarkData } from "@benchmark/workload";
import { defineRoute } from "@teyik0/furin";
import { Await, defer } from "@teyik0/furin/client";
import { Suspense } from "react";
import { route as rootRoute } from "./root";
export const route = defineRoute().config({ layout: rootRoute, mode: "ssr" })
  .loader(() => defer({ benchmark: loadBenchmarkData(200) }))
  .page(({ data }) => <Suspense fallback={<main data-benchmark-shell="streaming">Loading</main>}><Await resolve={data.benchmark}>{(resolved) => <BenchmarkPage data={resolved} scenario="streaming" />}</Await></Suspense>);
