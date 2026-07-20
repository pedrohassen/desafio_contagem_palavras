export interface MemoryUsageSummary {
  peakRssBytes: number;
  peakHeapUsedBytes: number;
}

export interface MemorySampler {
  start(): void;
  stop(): MemoryUsageSummary;
}
