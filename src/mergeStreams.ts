import { PassThrough, Transform } from "stream";
import { decorateWithAsyncIterator } from "./utils/decorateWithAsyncIterator";
import { parseArgs } from "./utils/parseArgs";
import { StreamOptions } from "node:stream";

export function mergeStreams(
  ...args:
    | [...streams: NodeJS.ReadableStream[]]
    | [...streams: NodeJS.ReadableStream[], options: StreamOptions<Transform>]
): NodeJS.ReadableStream {
  const { params: streams, options } = parseArgs(args);
  const last = streams[streams.length - 1];
  const passThrough = new PassThrough(options);
  passThrough.setMaxListeners(0);
  let cpt = streams.length;

  streams.forEach((s) => pipeStream(s));

  async function pipeStream(obj: unknown) {
    const stream = typeof obj === "function" ? await obj() : obj;
    stream.on("error", (e: Error) => passThrough.emit("error", e));
    stream.once("end", () => {
      if (--cpt === 0) {
        passThrough.end();
      }
    });

    stream.pipe(passThrough, { end: false });
  }

  if (last.readable) {
    decorateWithAsyncIterator(passThrough);
  }

  return passThrough;
}
