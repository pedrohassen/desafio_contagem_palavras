import type { RankedWord } from "../topK/TopKSelector.js";
import type { Reporter } from "./Reporter.js";

export class ConsoleReporter implements Reporter {
  report(filePath: string, elapsedMs: number, topWords: RankedWord[]): void {
    console.log(`Arquivo: ${filePath}`);
    console.log(`Tempo: ${elapsedMs} ms`);

    for (const { word, count } of topWords) {
      console.log(`${word}: ${count}`);
    }
  }
}
