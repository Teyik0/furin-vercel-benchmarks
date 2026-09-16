import { readFileSync, writeFileSync } from "node:fs";

interface LocalReport {
  clientAssetCount: number;
  clientCssBytes: number;
  clientJavaScriptBytes: number;
  serverBootstrapBytes: number;
  serverHandlerBytes: number;
}

interface Budget {
  absoluteAllowance: number;
  key: keyof LocalReport;
  relativeAllowance: number;
}

const [basePath, headPath, markdownPath] = process.argv.slice(2);
if (basePath === undefined || headPath === undefined || markdownPath === undefined) {
  throw new Error(
    "Usage: bun scripts/compare-local-reports.ts <base.json> <head.json> <report.md>"
  );
}

const base = JSON.parse(readFileSync(basePath, "utf8")) as LocalReport;
const head = JSON.parse(readFileSync(headPath, "utf8")) as LocalReport;
const budgets: Budget[] = [
  { absoluteAllowance: 4096, key: "serverHandlerBytes", relativeAllowance: 0.05 },
  { absoluteAllowance: 1024, key: "serverBootstrapBytes", relativeAllowance: 0.05 },
  { absoluteAllowance: 4096, key: "clientJavaScriptBytes", relativeAllowance: 0.03 },
  { absoluteAllowance: 2048, key: "clientCssBytes", relativeAllowance: 0.03 },
  { absoluteAllowance: 1, key: "clientAssetCount", relativeAllowance: 0 },
];
let failed = false;
const lines = [
  "## Vercel framework benchmark budgets",
  "",
  "| Metric | Base | Head | Limit | Result |",
  "|---|---:|---:|---:|---|",
];
for (const budget of budgets) {
  const baseValue = base[budget.key];
  const headValue = head[budget.key];
  const limit = Math.ceil(baseValue * (1 + budget.relativeAllowance) + budget.absoluteAllowance);
  const passed = headValue <= limit;
  failed ||= !passed;
  lines.push(
    `| ${budget.key} | ${baseValue} | ${headValue} | ${limit} | ${passed ? "pass" : "fail"} |`
  );
}
writeFileSync(markdownPath, `${lines.join("\n")}\n`);
if (failed) {
  process.exitCode = 1;
}
