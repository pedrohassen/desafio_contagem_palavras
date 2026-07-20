import type { WordCounter } from "./WordCounter.js";

export class InMemoryWordCounter implements WordCounter {
  private readonly countsByWord = new Map<string, number>();

  increment(word: string): void {
    const currentCount = this.countsByWord.get(word) ?? 0;
    this.countsByWord.set(word, currentCount + 1);
  }

  getCounts(): ReadonlyMap<string, number> {
    return this.countsByWord;
  }
}
