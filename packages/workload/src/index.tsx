export interface BenchmarkItem {
  id: number;
  label: string;
  score: number;
}

export interface BenchmarkData {
  generatedAt: number;
  items: BenchmarkItem[];
}

export function createBenchmarkData(): BenchmarkData {
  return {
    generatedAt: Date.now(),
    items: Array.from({ length: 40 }, (_, id) => ({
      id,
      label: `Item ${id}`,
      score: (id * 17) % 101,
    })),
  };
}

export async function loadBenchmarkData(delayMs: number): Promise<BenchmarkData> {
  await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  return createBenchmarkData();
}

export function BenchmarkPage({ data, scenario }: { data: BenchmarkData; scenario: string }) {
  return (
    <main data-benchmark-ready={scenario}>
      <h1>Framework benchmark: {scenario}</h1>
      <p data-generated-at={data.generatedAt}>{data.items.length} deterministic items</p>
      <section>
        {data.items.map((item) => (
          <article data-item={item.id} key={item.id}>
            <h2>{item.label}</h2>
            <progress max={100} value={item.score} />
            <span>{item.score}</span>
          </article>
        ))}
      </section>
    </main>
  );
}
