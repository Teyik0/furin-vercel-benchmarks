import { describe, expect, test } from "bun:test";
import {
  assertCacheHit,
  assertSuccessfulHttpStatus,
  isInstanceFirstRequest,
  rotate,
  summarize,
} from "../scripts/stats.ts";

describe("summarize", () => {
  test("reports stable percentile boundaries", () => {
    expect(summarize([40, 10, 30, 20, 50])).toEqual({
      average: 30,
      count: 5,
      max: 50,
      median: 30,
      min: 10,
      p75: 40,
      p95: 50,
    });
  });

  test("rejects empty samples", () => {
    expect(() => summarize([])).toThrow("at least one sample");
  });
});

test("identifies an actual first request from Server-Timing", () => {
  expect(
    isInstanceFirstRequest("furin_handler;dur=76.22, furin_instance_first_request")
  ).toBe(true);
  expect(isInstanceFirstRequest("furin_handler;dur=1.32")).toBe(false);
  expect(isInstanceFirstRequest(null)).toBe(false);
});


describe("assertSuccessfulHttpStatus", () => {
  test("accepts successful framework responses", () => {
    expect(() => assertSuccessfulHttpStatus(200, "tanstack", "isr")).not.toThrow();
  });

  test("rejects errors instead of benchmarking their latency", () => {
    expect(() => assertSuccessfulHttpStatus(404, "tanstack", "isr")).toThrow(
      "tanstack isr returned HTTP 404"
    );
  });
});


describe("assertCacheHit", () => {
  test("accepts Vercel cached ISR states", () => {
    expect(() => assertCacheHit("HIT", "furin")).not.toThrow();
    expect(() => assertCacheHit("PRERENDER", "next")).not.toThrow();
    expect(() => assertCacheHit("MISS", "furin")).toThrow(
      "furin ISR expected x-vercel-cache HIT or PRERENDER, received MISS"
    );
  });
});


describe("rotate", () => {
  test("balances the first framework without changing the members", () => {
    expect(rotate(["furin", "next", "tanstack"], 0)).toEqual(["furin", "next", "tanstack"]);
    expect(rotate(["furin", "next", "tanstack"], 1)).toEqual(["next", "tanstack", "furin"]);
    expect(rotate(["furin", "next", "tanstack"], 4)).toEqual(["next", "tanstack", "furin"]);
  });
});
