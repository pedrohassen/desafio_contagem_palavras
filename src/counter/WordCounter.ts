export interface WordCounter {
  increment(word: string): void;
  getCounts(): ReadonlyMap<string, number>;
}
