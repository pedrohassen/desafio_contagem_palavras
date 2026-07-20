import { BoundedMinHeap } from "./BoundedMinHeap.js";
import type { RankedWord, TopKSelector } from "./TopKSelector.js";

export class MinHeapTopKSelector implements TopKSelector {
  selectTopK(counts: ReadonlyMap<string, number>, k: number): RankedWord[] {
    const heap = new BoundedMinHeap(k);

    for (const [word, count] of counts) {
      heap.offer({ word, count });
    }

    return heap.toSortedDescending();
  }
}
