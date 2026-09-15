import { furin } from "@teyik0/furin";
import { type AnyElysia, Elysia } from "elysia";
import { BENCHMARK_NONCE } from "./.benchmark-nonce";
const createFurin = furin as unknown as (options: { pagesDir: string }) => Promise<(app: AnyElysia) => AnyElysia>;
const app = new Elysia();
app.get("/api/ping", () => Response.json({ framework: "furin", nonce: BENCHMARK_NONCE }, { headers: { "cache-control": "private, no-store" } }));
app.use(await createFurin({ pagesDir: "./src/pages" }));
export default app;
