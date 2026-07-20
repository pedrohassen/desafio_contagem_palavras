import type { RankedWord } from "../topK/TopKSelector.js";

export interface Reporter {
  report(filePath: string, elapsedMs: number, topWords: RankedWord[]): void;
}
