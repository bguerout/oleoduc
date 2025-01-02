import { Readable } from "stream";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isReadableStream(stream: any): stream is Readable {
  return (
    stream !== null &&
    typeof stream === "object" &&
    typeof stream.read === "function" &&
    typeof stream.readable === "boolean" &&
    typeof stream.pipe === "function" &&
    typeof stream.on === "function"
  );
}
