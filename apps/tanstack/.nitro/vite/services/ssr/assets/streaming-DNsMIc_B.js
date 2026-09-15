import { n as jsxRuntimeExports, a as reactExports } from "../server.js";
import { R as Route, B as BenchmarkPage } from "./router-C5WBpgJn.js";
import "node:async_hooks";
import "node:stream";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream/web";
function DeferredTree({
  data
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(BenchmarkPage, { data: reactExports.use(data), scenario: "streaming" });
}
function Page() {
  const {
    data
  } = Route.useLoaderData();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("main", { "data-benchmark-shell": "streaming", children: "Loading" }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(DeferredTree, { data }) });
}
export {
  Page as component
};
