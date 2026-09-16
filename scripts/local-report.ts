import { readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";

interface LocalReport {
  clientAssetCount: number;
  clientCssBytes: number;
  clientJavaScriptBytes: number;
  serverBootstrapBytes: number;
  serverHandlerBytes: number;
}

const root = resolve(import.meta.dir, "..");
const outputPath = process.argv[2];
if (outputPath === undefined) {
  throw new Error("Usage: bun scripts/local-report.ts <output.json>");
}

const functionDir = join(root, "apps/furin/.vercel/output/functions/__server.func");
const clientDir = join(root, "apps/furin/.vercel/output/static/_client");
const clientFiles = readdirSync(clientDir, { withFileTypes: true }).filter((entry) => entry.isFile());
const bytesForExtension = (extension: string): number =>
  clientFiles
    .filter((entry) => extname(entry.name) === extension)
    .reduce((total, entry) => total + statSync(join(clientDir, entry.name)).size, 0);

const report: LocalReport = {
  clientAssetCount: clientFiles.length,
  clientCssBytes: bytesForExtension(".css"),
  clientJavaScriptBytes: bytesForExtension(".js"),
  serverBootstrapBytes: statSync(join(functionDir, "index.js")).size,
  serverHandlerBytes: statSync(join(functionDir, "handler.js")).size,
};

writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
