import { Writable } from "stream";

type WriteToStdoutCallback = (error: Error | null | undefined) => void;

export function writeToStdout() {
  return new Writable({
    write(chunk: Uint8Array | string, encoding: BufferEncoding, callback: WriteToStdoutCallback) {
      //write to stdout as a side effect and honor finish event
      //https://stackoverflow.com/questions/33190458/node-pipe-to-stdout-how-do-i-tell-if-drained
      process.stdout.write(chunk, callback);
    },
  });
}
