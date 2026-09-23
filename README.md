# Furin Vercel Benchmarks

A reproducible Vercel comparison of Furin, Next.js, and TanStack Start using identical React workloads.

## Scenarios

- `dynamic`: dynamic SSR with the same 40-item React tree
- `loader`: dynamic SSR after a deterministic 50 ms server loader
- `isr`: the same server loader with a 300-second ISR window
- `streaming`: an immediate shell and a deterministic 200 ms server-loaded subtree
- `/api/ping`: bootstrap control only; never used as the headline framework result

All apps use React 19, `cdg1`, Fluid Compute, and explicit `private, no-store` headers for dynamic controls. The TanStack app follows the current official Vercel scaffold (Nitro before TanStack Start) and its documented cache-header ISR strategy. Each deployment round writes a unique `.benchmark-nonce.ts` imported by server code to defeat Function deduplication.

## Local Furin source

Register the Furin package from the Furin repository, then link it into the benchmark app:

```bash
cd ../furin/packages/core
bun link
cd ../../furin-vercel-benchmarks
bun run setup
```

Furin is built locally and deployed with `vercel deploy --prebuilt`; unpublished source never has to be installed by Vercel. The benchmark-only Bun plugin in `apps/furin/furin.config.ts` resolves framework peer dependencies from this repository so `bun link` does not bundle a second physical React copy.

## Run

```bash
bun run build
bun run benchmark --rounds 3 --warm-samples 5
```

The runner rotates deployment order and interleaves warm requests so each framework sees the same time windows. It targets the public production aliases with direct `curl` requests, avoiding the authentication proxy used by protected deployment URLs. Reports include both user-visible TTFB and backend time (TTFB minus DNS/TCP/TLS pre-transfer time). The `cold` phase means first sample after deployment; Vercel may serve it from a warm instance. The summary separately counts Furin samples carrying its instance-first `Server-Timing` marker. Browser navigation uses a programmatic click timed inside the page on the public production aliases after verifying their build nonce; raw reports include every resulting resource timing. Every HTTP response must be successful, and ISR hit samples must carry `x-vercel-cache: HIT`; otherwise the run fails instead of reporting invalid timings. Raw JSON and a Markdown summary are written under `reports/`.

A high-round run creates many Vercel deployments. Start with 3 rounds; use 20–30 only when the account budget and rate limits are understood.

## CI integration

The repository exposes two deterministic commands for Furin PR checks:

```bash
bun run --cwd apps/furin build
bun run report:local ./local-report.json
bun run compare:local ./base.json ./head.json ./comparison.md
```

The local report tracks the Vercel Function handler/bootstrap and client asset sizes. `compare:local` allows 5% plus 4 KiB for the handler, 5% plus 1 KiB for the bootstrap, and 3% plus a small absolute allowance for client JS/CSS. This catches bundle regressions without involving network latency.

The repository's own CI checks out `Teyik0/furin`, links its current `packages/core`, and builds all three fixtures. Furin's CI performs the same validation for every pull request and compares local reports once the target branch supports the Vercel adapter.

Live Vercel measurements remain scheduled or manually dispatched from Furin. They require `VERCEL_TOKEN`, run multiple deployment rounds, and are uploaded as artifacts rather than treating one noisy network sample as a required PR check.
