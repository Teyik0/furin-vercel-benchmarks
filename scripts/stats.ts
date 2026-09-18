export interface Summary {
  average: number;
  count: number;
  max: number;
  median: number;
  min: number;
  p75: number;
  p95: number;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function summarize(values: number[]): Summary {
  if (values.length === 0) {
    throw new Error("summarize requires at least one sample");
  }
  const sorted = values.toSorted((a, b) => a - b);
  const percentile = (fraction: number) =>
    sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)] as number;
  return {
    average: round(values.reduce((total, value) => total + value, 0) / values.length),
    count: values.length,
    max: sorted.at(-1) as number,
    median: percentile(0.5),
    min: sorted[0] as number,
    p75: percentile(0.75),
    p95: percentile(0.95),
  };
}

export function assertSuccessfulHttpStatus(
  status: number,
  framework: string,
  scenario: string
): void {
  if (status < 200 || status >= 300) {
    throw new Error(`${framework} ${scenario} returned HTTP ${status}`);
  }
}

export function assertCacheHit(cache: string | null, framework: string): void {
  if (cache !== "HIT" && cache !== "PRERENDER") {
    throw new Error(
      `${framework} ISR expected x-vercel-cache HIT or PRERENDER, received ${cache ?? "no header"}`
    );
  }
}

export function rotate<T>(values: readonly T[], offset: number): T[] {
  if (values.length === 0) {
    return [];
  }
  const start = offset % values.length;
  return [...values.slice(start), ...values.slice(0, start)];
}
