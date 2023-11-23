import { PassThrough } from "stream";
import { decorateWithPromise } from "./utils/decorateWithPromise";
import { decorateWithAsyncIterator } from "./utils/decorateWithAsyncIterator";
import { parseArgs } from "./utils/parseArgs";
import { Duplexer } from "./utils/Duplexer";

function pipeStreamsTogether(streams, wrapper) {
  for (const [i, stream] of streams.entries()) {
    const next = streams[i + 1];
    if (next) {
      stream.pipe(next);
    }

    if (stream !== wrapper) {
      stream.on("error", (err) => wrapper.emit("error", err));
    }
  }
}

function getWrapper(first, last, options = {}) {
  let wrapper;
  if (first === last) {
    wrapper = first;
  } else if (first.writable && last.readable) {
    wrapper = new Duplexer(first, last, options);
  } else if (first.writable) {
    wrapper = first;
  } else if (last.readable) {
    wrapper = last;
  } else {
    wrapper = new PassThrough(options);
  }

  return wrapper;
}

export function oleoduc(...args) {
  const {
    streams,
    options: { promisify, ...rest },
  } = parseArgs(args, { promisify: true });

  if (streams.length === 0) {
    throw new Error("You must provide at least one stream");
  }

  const first = streams[0];
  const last = streams[streams.length - 1];
  const wrapper = getWrapper(first, last, rest);

  if (last.readable) {
    decorateWithAsyncIterator(wrapper);
  }

  if (promisify) {
    decorateWithPromise(
      wrapper,
      new Promise((resolve, reject) => {
        wrapper.on("error", (e) => reject(e));
        last.on("finish", resolve); // Needed by nodejs 12 and previous
        last.on("close", resolve);
      }),
    );
  } else if (wrapper !== last && wrapper !== first) {
    last.on("finish", () => wrapper.emit("finish")); // Needed by nodejs 12 and previous
    last.on("close", () => wrapper.emit("close"));
  }

  pipeStreamsTogether(streams, wrapper);

  return wrapper;
}
