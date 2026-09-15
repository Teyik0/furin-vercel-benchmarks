import { BENCHMARK_NONCE } from "../../.benchmark-nonce";
export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ framework: "next", nonce: BENCHMARK_NONCE }, { headers: { "cache-control": "private, no-store" } });
}
