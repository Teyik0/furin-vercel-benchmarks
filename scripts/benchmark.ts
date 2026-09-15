import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright";
import { assertCacheHit, assertSuccessfulHttpStatus, rotate, summarize } from "./stats.ts";

type FrameworkName = "furin" | "next" | "tanstack";
type Phase = "cold" | "hit" | "initial" | "navigation" | "warm";
type Scenario = "dynamic" | "isr" | "loader" | "navigation" | "ping" | "streaming";

interface FrameworkConfig {
  alias: string;
  appDir: string;
  name: FrameworkName;
  noncePath: string;
  project: string;
}

interface BrowserResourceMeasurement {
  durationMs: number;
  name: string;
  transferSize: number;
  ttfbMs: number;
}

interface Measurement {
  browserResources?: BrowserResourceMeasurement[];
  bytes: number;
  cache: string | null;
  framework: FrameworkName;
  phase: Phase;
  round: number;
  scenario: Scenario;
  serverTiming: string | null;
  status: number;
  totalMs: number;
  ttfbMs: number | null;
  url: string;
}

interface Options {
  browser: boolean;
  rounds: number;
  warmSamples: number;
}

const ROOT = resolve(import.meta.dir, "..");
const TEAM = process.env.VERCEL_TEAM ?? "teyik0-team";
const FRAMEWORKS: FrameworkConfig[] = [
  {
    alias: "https://furin-baseline.vercel.app",
    appDir: join(ROOT, "apps/furin"),
    name: "furin",
    noncePath: join(ROOT, "apps/furin/src/.benchmark-nonce.ts"),
    project: "furin-baseline",
  },
  {
    alias: "https://next-baseline.vercel.app",
    appDir: join(ROOT, "apps/next"),
    name: "next",
    noncePath: join(ROOT, "apps/next/app/.benchmark-nonce.ts"),
    project: "next-baseline",
  },
  {
    alias: "https://tanstack-baseline.vercel.app",
    appDir: join(ROOT, "apps/tanstack"),
    name: "tanstack",
    noncePath: join(ROOT, "apps/tanstack/src/.benchmark-nonce.ts"),
    project: "tanstack-baseline",
  },
];

function parseOptions(args: string[]): Options {
  let browser = true;
  let rounds = 1;
  let warmSamples = 3;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--no-browser") {
      browser = false;
    } else if (arg === "--rounds") {
      rounds = Number(args[index + 1]);
      index += 1;
    } else if (arg === "--warm-samples") {
      warmSamples = Number(args[index + 1]);
      index += 1;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!(Number.isInteger(rounds) && rounds > 0)) {
    throw new Error("--rounds must be a positive integer");
  }
  if (!(Number.isInteger(warmSamples) && warmSamples > 0)) {
    throw new Error("--warm-samples must be a positive integer");
  }
  return { browser, rounds, warmSamples };
}

async function run(command: string[], cwd: string): Promise<string> {
  const process = Bun.spawn(command, { cwd, stderr: "pipe", stdout: "pipe" });
  const [exitCode, stdout, stderr] = await Promise.all([
    process.exited,
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ]);
  if (stderr.trim()) {
    console.error(stderr.trim());
  }
  if (exitCode !== 0) {
    throw new Error(`Command failed (${exitCode}): ${command.join(" ")}\n${stdout}\n${stderr}`);
  }
  return stdout;
}

function writeNonce(framework: FrameworkConfig, nonce: string): void {
  writeFileSync(framework.noncePath, `export const BENCHMARK_NONCE = ${JSON.stringify(nonce)};\n`);
}

function deploymentUrl(output: string): string {
  const urls = output.match(/https:\/\/[^\s]+\.vercel\.app/g);
  const url = urls?.at(-1);
  if (url === undefined) {
    throw new Error(`Vercel did not report a deployment URL:\n${output}`);
  }
  return url;
}

async function ensureLinked(framework: FrameworkConfig): Promise<void> {
  if (await Bun.file(join(framework.appDir, ".vercel/project.json")).exists()) {
    return;
  }
  await run(
    ["bunx", "vercel", "link", "--yes", "--project", framework.project, "--scope", TEAM, "--no-color"],
    framework.appDir
  );
}

async function deploy(framework: FrameworkConfig): Promise<string> {
  await ensureLinked(framework);
  let deployDir = framework.appDir;
  if (framework.name === "furin") {
    await run(["bun", "run", "build"], framework.appDir);
  } else {
    await run(["bunx", "vercel", "build", "--yes", "--prod", "--scope", TEAM, "--no-color"], framework.appDir);
    const rootOutput = join(ROOT, ".vercel/output");
    rmSync(rootOutput, { force: true, recursive: true });
    mkdirSync(dirname(rootOutput), { recursive: true });
    cpSync(join(framework.appDir, ".vercel/output"), rootOutput, { recursive: true, verbatimSymlinks: true });
    deployDir = ROOT;
  }
  return deploymentUrl(
    await run(
      ["bunx", "vercel", "deploy", "--prebuilt", "--yes", "--prod", "--project", framework.project, "--scope", TEAM, "--regions", "cdg1", "--no-color"],
      deployDir
    )
  );
}

function headerValue(headers: string, name: string): string | null {
  const prefix = `${name.toLowerCase()}:`;
  const line = headers.split(/\r?\n/).find((entry) => entry.toLowerCase().startsWith(prefix));
  return line?.slice(line.indexOf(":") + 1).trim() ?? null;
}

async function measureHttp(
  framework: FrameworkConfig,
  deployment: string,
  path: string,
  round: number,
  scenario: Scenario,
  phase: Phase
): Promise<Measurement> {
  const tempDir = mkdtempSync(join(tmpdir(), "vercel-benchmark-"));
  const headersPath = join(tempDir, "headers.txt");
  const marker = "__BENCHMARK_METRIC__";
  const format = `${marker}{"status":%{http_code},"ttfb":%{time_starttransfer},"total":%{time_total},"bytes":%{size_download}}`;
  const output = await run(
    ["bunx", "vercel", "curl", `${deployment}${path}`, "--scope", TEAM, "--", "--silent", "--output", "/dev/null", "--dump-header", headersPath, "--write-out", format],
    framework.appDir
  );
  const encoded = output.slice(output.lastIndexOf(marker) + marker.length).trim();
  const timing = JSON.parse(encoded) as { bytes: number; status: number; total: number; ttfb: number };
  assertSuccessfulHttpStatus(timing.status, framework.name, scenario);
  const headers = readFileSync(headersPath, "utf8");
  return {
    bytes: timing.bytes,
    cache: headerValue(headers, "x-vercel-cache"),
    framework: framework.name,
    phase,
    round,
    scenario,
    serverTiming: headerValue(headers, "server-timing"),
    status: timing.status,
    totalMs: timing.total * 1000,
    ttfbMs: timing.ttfb * 1000,
    url: `${deployment}${path}`,
  };
}

async function waitForAlias(framework: FrameworkConfig, nonce: string): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const response = await fetch(`${framework.alias}/dynamic?nonce=${encodeURIComponent(nonce)}`);
    if (response.ok && (await response.text()).includes(nonce)) {
      return;
    }
    await Bun.sleep(500);
  }
  throw new Error(`Alias did not converge for ${framework.name}`);
}

async function measureNavigation(
  framework: FrameworkConfig,
  round: number,
  nonce: string
): Promise<Measurement> {
  await waitForAlias(framework, nonce);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`${framework.alias}/dynamic`, { waitUntil: "networkidle" });
    const startedAt = await page.locator('[data-nav="loader"]').evaluate((link) => {
      const start = performance.now();
      (link as HTMLAnchorElement).click();
      return start;
    });
    await page.locator('[data-benchmark-ready="loader"]').waitFor();
    const totalMs = await page.evaluate((start) => performance.now() - start, startedAt);
    const browserResources = await page.evaluate((start) =>
      performance
        .getEntriesByType("resource")
        .filter((entry) => entry.startTime >= start)
        .map((entry) => {
          const resource = entry as PerformanceResourceTiming;
          return {
            durationMs: resource.duration,
            name: resource.name,
            transferSize: resource.transferSize,
            ttfbMs: resource.responseStart - resource.startTime,
          };
        })
    , startedAt);
    return {
      browserResources,
      bytes: 0,
      cache: null,
      framework: framework.name,
      phase: "navigation",
      round,
      scenario: "navigation",
      serverTiming: null,
      status: 200,
      totalMs,
      ttfbMs: null,
      url: `${framework.alias}/dynamic -> /loader`,
    };
  } finally {
    await browser.close();
  }
}

function markdown(measurements: Measurement[], options: Options): string {
  const lines = [
    "# Vercel framework benchmark",
    "",
    `Rounds: ${options.rounds}; warm samples: ${options.warmSamples}; region: cdg1.`,
    "",
    "| Framework | Scenario | Phase | Cache | Samples | Median TTFB | p95 TTFB | Median total | p95 total |",
    "|---|---|---|---|---:|---:|---:|---:|---:|",
  ];
  const keys = [...new Set(measurements.map((item) => `${item.framework}|${item.scenario}|${item.phase}`))].sort();
  for (const key of keys) {
    const [framework, scenario, phase] = key.split("|");
    const group = measurements.filter((item) => `${item.framework}|${item.scenario}|${item.phase}` === key);
    const totals = summarize(group.map((item) => item.totalMs));
    const ttfbValues = group.flatMap((item) => item.ttfbMs === null ? [] : [item.ttfbMs]);
    const ttfb = ttfbValues.length > 0 ? summarize(ttfbValues) : null;
    const caches = [...new Set(group.flatMap((item) => item.cache === null ? [] : [item.cache]))];
    lines.push(`| ${framework} | ${scenario} | ${phase} | ${caches.join(", ") || "—"} | ${group.length} | ${ttfb ? `${ttfb.median.toFixed(1)} ms` : "—"} | ${ttfb ? `${ttfb.p95.toFixed(1)} ms` : "—"} | ${totals.median.toFixed(1)} ms | ${totals.p95.toFixed(1)} ms |`);
  }
  return `${lines.join("\n")}\n`;
}

const options = parseOptions(process.argv.slice(2));
const measurements: Measurement[] = [];
const warmScenarios: { path: string; scenario: Scenario }[] = [
  { path: "/loader", scenario: "loader" },
  { path: "/streaming", scenario: "streaming" },
  { path: "/api/ping", scenario: "ping" },
];
for (let round = 1; round <= options.rounds; round += 1) {
  const deployments = new Map<FrameworkName, { nonce: string; url: string }>();
  for (const framework of rotate(FRAMEWORKS, round - 1)) {
    const nonce = `${Date.now()}-${round}-${framework.name}`;
    writeNonce(framework, nonce);
    console.log(`[benchmark] deploying ${framework.name}, round ${round}`);
    const url = await deploy(framework);
    deployments.set(framework.name, { nonce, url });
    measurements.push(await measureHttp(framework, url, "/dynamic", round, "dynamic", "cold"));
  }

  for (let sample = 0; sample < options.warmSamples; sample += 1) {
    for (const framework of rotate(FRAMEWORKS, round + sample)) {
      const deployment = deployments.get(framework.name);
      if (deployment === undefined) {
        throw new Error(`Missing deployment for ${framework.name}`);
      }
      measurements.push(
        await measureHttp(
          framework,
          deployment.url,
          `/dynamic?sample=${round}-${sample}`,
          round,
          "dynamic",
          "warm"
        )
      );
    }

    for (let scenarioIndex = 0; scenarioIndex < warmScenarios.length; scenarioIndex += 1) {
      const { path, scenario } = warmScenarios[scenarioIndex] as {
        path: string;
        scenario: Scenario;
      };
      for (const framework of rotate(FRAMEWORKS, round + sample + scenarioIndex)) {
        const deployment = deployments.get(framework.name);
        if (deployment === undefined) {
          throw new Error(`Missing deployment for ${framework.name}`);
        }
        measurements.push(
          await measureHttp(framework, deployment.url, path, round, scenario, "warm")
        );
      }
    }
  }

  for (const framework of rotate(FRAMEWORKS, round)) {
    const deployment = deployments.get(framework.name);
    if (deployment === undefined) {
      throw new Error(`Missing deployment for ${framework.name}`);
    }
    measurements.push(
      await measureHttp(framework, deployment.url, "/isr", round, "isr", "initial")
    );
  }
  for (let sample = 0; sample < options.warmSamples; sample += 1) {
    for (const framework of rotate(FRAMEWORKS, round + sample)) {
      const deployment = deployments.get(framework.name);
      if (deployment === undefined) {
        throw new Error(`Missing deployment for ${framework.name}`);
      }
      const hit = await measureHttp(framework, deployment.url, "/isr", round, "isr", "hit");
      assertCacheHit(hit.cache, framework.name);
      measurements.push(hit);
    }
  }

  if (options.browser) {
    for (let sample = 0; sample < options.warmSamples; sample += 1) {
      for (const framework of rotate(FRAMEWORKS, round + sample)) {
        const deployment = deployments.get(framework.name);
        if (deployment === undefined) {
          throw new Error(`Missing deployment for ${framework.name}`);
        }
        measurements.push(await measureNavigation(framework, round, deployment.nonce));
      }
    }
  }
}
mkdirSync(join(ROOT, "reports"), { recursive: true });
const stamp = new Date().toISOString().replaceAll(":", "-");
writeFileSync(join(ROOT, "reports", `${stamp}.json`), `${JSON.stringify({ measurements, options }, null, 2)}\n`);
const report = markdown(measurements, options);
writeFileSync(join(ROOT, "reports", `${stamp}.md`), report);
console.log(report);
