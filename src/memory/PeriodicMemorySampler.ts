import type { MemorySampler, MemoryUsageSummary } from "./MemorySampler.js";

const DEFAULT_SAMPLING_INTERVAL_MS = 20;

export class PeriodicMemorySampler implements MemorySampler {
  private peakRssBytes = 0;
  private peakHeapUsedBytes = 0;
  private samplingIntervalHandle: NodeJS.Timeout | undefined;

  constructor(private readonly samplingIntervalMs: number = DEFAULT_SAMPLING_INTERVAL_MS) {}

  start(): void {
    this.peakRssBytes = 0;
    this.peakHeapUsedBytes = 0;
    this.recordSample();
    this.samplingIntervalHandle = setInterval(() => this.recordSample(), this.samplingIntervalMs);
  }

  stop(): MemoryUsageSummary {
    if (this.samplingIntervalHandle !== undefined) {
      clearInterval(this.samplingIntervalHandle);
      this.samplingIntervalHandle = undefined;
    }
    this.recordSample();

    return {
      peakRssBytes: this.peakRssBytes,
      peakHeapUsedBytes: this.peakHeapUsedBytes,
    };
  }

  private recordSample(): void {
    const usage = process.memoryUsage();
    this.peakRssBytes = Math.max(this.peakRssBytes, usage.rss);
    this.peakHeapUsedBytes = Math.max(this.peakHeapUsedBytes, usage.heapUsed);
  }
}
