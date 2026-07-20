import { createReadStream } from "node:fs";
import type { WordReader } from "./WordReader.js";

const NEWLINE_BYTE = 0x0a;
const CARRIAGE_RETURN_BYTE = 0x0d;
const READ_CHUNK_SIZE_BYTES = 1024 * 1024;
const UTF8_BOM_BYTES = Buffer.from([0xef, 0xbb, 0xbf]);

export class StreamingFileWordReader implements WordReader {
  async *readWords(filePath: string): AsyncIterable<string> {
    const fileStream = createReadStream(filePath, { highWaterMark: READ_CHUNK_SIZE_BYTES });
    let unterminatedLineBytes = Buffer.alloc(0);
    let isFirstChunk = true;

    for await (const chunk of fileStream as AsyncIterable<Buffer>) {
      let buffer = Buffer.concat([unterminatedLineBytes, chunk]);

      if (isFirstChunk) {
        if (buffer.subarray(0, UTF8_BOM_BYTES.length).equals(UTF8_BOM_BYTES)) {
          buffer = buffer.subarray(UTF8_BOM_BYTES.length);
        }
        isFirstChunk = false;
      }

      let lineStartIndex = 0;

      for (let byteIndex = 0; byteIndex < buffer.length; byteIndex++) {
        if (buffer[byteIndex] === NEWLINE_BYTE) {
          yield decodeLine(buffer, lineStartIndex, byteIndex);
          lineStartIndex = byteIndex + 1;
        }
      }

      unterminatedLineBytes = buffer.subarray(lineStartIndex);
    }

    if (unterminatedLineBytes.length > 0) {
      yield decodeLine(unterminatedLineBytes, 0, unterminatedLineBytes.length);
    }
  }
}

function decodeLine(buffer: Buffer, start: number, end: number): string {
  const endsWithCarriageReturn = end > start && buffer[end - 1] === CARRIAGE_RETURN_BYTE;
  const lineEnd = endsWithCarriageReturn ? end - 1 : end;
  return buffer.toString("utf8", start, lineEnd);
}
