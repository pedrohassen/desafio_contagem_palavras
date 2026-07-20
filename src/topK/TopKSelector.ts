export interface RankedWord {
  word: string;
  count: number;
}

export interface TopKSelector {
  selectTopK(counts: ReadonlyMap<string, number>, k: number): RankedWord[];
}
