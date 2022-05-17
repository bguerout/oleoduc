const { PassThrough } = require("stream");
const decorateWithPromise = require("./utils/decorateWithPromise");
const decorateWithAsyncIterator = require("./utils/decorateWithAsyncIterator");
const parseArgs = require("./utils/parseArgs");
const Duplexer = require("./utils/Duplexer");

function pipeStreamsTogether(streams, wrapper) {
  for (let [i, stream] of streams.entries()) {
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

function oleoduc(...args) {
  let {
    streams,
    options: { promisify, ...rest },
  } = parseArgs(args, { promisify: true });

  if (streams.length === 0) {
    throw new Error("You must provide at least one stream");
  }

  let first = streams[0];
  let last = streams[streams.length - 1];
  let wrapper = getWrapper(first, last, rest);

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
      })
    );
  } else if (wrapper !== last && wrapper !== first) {
    last.on("finish", () => wrapper.emit("finish")); // Needed by nodejs 12 and previous
    last.on("close", () => wrapper.emit("close"));
  }

  pipeStreamsTogether(streams, wrapper);

  return wrapper;
}

module.exports = oleoduc;
