import { StreamingFileWordReader } from "./reader/StreamingFileWordReader.js";
import { InMemoryWordCounter } from "./counter/InMemoryWordCounter.js";
import { MinHeapTopKSelector } from "./topK/MinHeapTopKSelector.js";
import { ConsoleReporter } from "./reporter/ConsoleReporter.js";
import { PeriodicMemorySampler } from "./memory/PeriodicMemorySampler.js";
import type { MemoryUsageSummary } from "./memory/MemorySampler.js";

const TOP_WORDS_COUNT = 20;
const reporter = new ConsoleReporter();

async function processFile(filePath: string): Promise<void> {
  const memorySampler = new PeriodicMemorySampler();
  const reader = new StreamingFileWordReader();
  const counter = new InMemoryWordCounter();

  memorySampler.start();
  const startTime = performance.now();

  for await (const word of reader.readWords(filePath)) {
    counter.increment(word);
  }

  const topWords = new MinHeapTopKSelector().selectTopK(counter.getCounts(), TOP_WORDS_COUNT);
  const elapsedMs = Math.round(performance.now() - startTime);
  const memoryUsageSummary = memorySampler.stop();

  reporter.report(filePath, elapsedMs, topWords);
  logMemoryUsageToStderr(memoryUsageSummary);
}

function logMemoryUsageToStderr(summary: MemoryUsageSummary): void {
  const toMebibytes = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);
  console.error(
    `[memoria] pico RSS: ${toMebibytes(summary.peakRssBytes)} MB, pico heap usado: ${toMebibytes(summary.peakHeapUsedBytes)} MB`
  );
}

const filePaths = process.argv.slice(2);

if (filePaths.length === 0) {
  console.error("Uso: npm run start -- <arquivo1.txt> [arquivo2.txt ...]");
  process.exit(1);
}

for (const filePath of filePaths) {
  await processFile(filePath);
}
