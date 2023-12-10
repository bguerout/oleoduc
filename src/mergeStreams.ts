import { PassThrough } from "stream";
import { decorateWithAsyncIterator } from "./utils/decorateWithAsyncIterator";
import { parseArgs } from "./utils/parseArgs";

export function mergeStreams(...args) {
  const { streams, options } = parseArgs(args);
  const last = streams[streams.length - 1];
  const passThrough = new PassThrough(options);
  passThrough.setMaxListeners(0);
  let cpt = streams.length;

  streams.forEach((s) => pipeStream(s));

  async function pipeStream(obj) {
    const stream = typeof obj === "function" ? await obj() : obj;
    stream.on("error", (e) => passThrough.emit("error", e));
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
