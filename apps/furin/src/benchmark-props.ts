interface FlatBenchmarkProps<T> {
  benchmark: T;
}

interface LegacyBenchmarkProps<T> {
  data: { benchmark: T };
}

export function readBenchmark<T>(
  props: FlatBenchmarkProps<T> | LegacyBenchmarkProps<T>
): T {
  return "benchmark" in props ? props.benchmark : props.data.benchmark;
}
