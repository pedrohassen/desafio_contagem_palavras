export interface WordReader {
  readWords(filePath: string): AsyncIterable<string>;
}
