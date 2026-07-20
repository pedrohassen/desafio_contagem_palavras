import type { RankedWord } from "./TopKSelector.js";

export class BoundedMinHeap {
  private readonly items: RankedWord[] = [];

  constructor(private readonly capacity: number) {}

  offer(candidate: RankedWord): void {
    if (this.items.length < this.capacity) {
      this.items.push(candidate);
      this.bubbleUp(this.items.length - 1);
      return;
    }

    const smallestInHeap = this.items[0];
    if (smallestInHeap !== undefined && candidate.count > smallestInHeap.count) {
      this.items[0] = candidate;
      this.bubbleDown(0);
    }
  }

  toSortedDescending(): RankedWord[] {
    return [...this.items].sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
  }

  private bubbleUp(startIndex: number): void {
    let index = startIndex;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.items[parentIndex]!.count <= this.items[index]!.count) break;
      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  private bubbleDown(startIndex: number): void {
    let index = startIndex;
    const size = this.items.length;

    while (true) {
      const leftIndex = index * 2 + 1;
      const rightIndex = index * 2 + 2;
      let smallestIndex = index;

      if (leftIndex < size && this.items[leftIndex]!.count < this.items[smallestIndex]!.count) {
        smallestIndex = leftIndex;
      }
      if (rightIndex < size && this.items[rightIndex]!.count < this.items[smallestIndex]!.count) {
        smallestIndex = rightIndex;
      }
      if (smallestIndex === index) break;

      this.swap(index, smallestIndex);
      index = smallestIndex;
    }
  }

  private swap(indexA: number, indexB: number): void {
    const temp = this.items[indexA]!;
    this.items[indexA] = this.items[indexB]!;
    this.items[indexB] = temp;
  }
}
