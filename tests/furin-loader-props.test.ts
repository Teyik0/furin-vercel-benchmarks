import { describe, expect, test } from "bun:test";
import { readBenchmark } from "../apps/furin/src/benchmark-props";

describe("readBenchmark", () => {
  test("reads the flat loader prop exposed by current Furin", () => {
    expect(readBenchmark({ benchmark: "flat" })).toBe("flat");
  });

  test("keeps benchmark fixtures compatible with the baseline data wrapper", () => {
    expect(readBenchmark({ data: { benchmark: "legacy" } })).toBe("legacy");
  });
});
