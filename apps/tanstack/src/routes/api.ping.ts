import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { BENCHMARK_NONCE } from "../.benchmark-nonce";
export const Route = createFileRoute("/api/ping")({ server: { handlers: { GET: () => json({ framework: "tanstack-start", nonce: BENCHMARK_NONCE }, { headers: { "cache-control": "private, no-store" } }) } } });
