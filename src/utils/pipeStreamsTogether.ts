import { AnyStream } from "../types";
import { Readable, Writable } from "stream";

export function pipeStreamsTogether(streams: AnyStream[], wrapper: AnyStream) {
  for (const [i, stream] of streams.entries()) {
    const next = streams[i + 1];
    if (next) {
      // we assume that the oleoduc is correctly configured
      const readable = stream as Readable;
      const writable = next as Writable;
      readable.pipe(writable);
    }

    if (stream !== wrapper) {
      stream.on("error", (err) => wrapper.emit("error", err));
    }
  }
}
