/**
 *  Adapted from https://www.npmjs.com/package/multipipe
 */
const { Duplex } = require("stream");
const { PassThrough } = require("stream");
const decorateWithPromise = require("./utils/decorateWithPromise");
const decorateWithAsyncIterator = require("./utils/decorateWithAsyncIterator");
const parseArgs = require("./utils/parseArgs");

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

class Duplexer extends Duplex {
  constructor(input, output, options) {
    super(options || { writableObjectMode: true, readableObjectMode: true });
    this.input = input;
    this.output = output;
    this.output.on("end", () => this.push(null));
    this.output.on("data", (chunk) => {
      let backpressure = !this.push(chunk);
      if (backpressure) {
        this.output.pause();
      }
    });
  }
  _write(chunk, encoding, callback) {
    this.input.write(chunk, encoding, callback);
  }
  _final(callback) {
    this.input.end(null, null, callback);
  }
  _read() {
    this.output.resume();
  }
}

function oleoduc(...args) {
  let { streams, options } = parseArgs(args, { promisify: true });

  if (streams.length === 0) {
    throw new Error("You must provide at least one stream");
  }

  let first = streams[0];
  let last = streams[streams.length - 1];
  let wrapper;

  if (streams.length === 1) {
    wrapper = streams[0];
  } else if (first.writable && last.readable) {
    wrapper = new Duplexer(first, last, options);
  } else if (first.writable) {
    wrapper = first;
  } else if (last.readable) {
    wrapper = last;
  } else {
    wrapper = new PassThrough(options);
  }

  pipeStreamsTogether(streams, wrapper);

  if (options.promisify) {
    decorateWithPromise(
      wrapper,
      () =>
        new Promise((resolve, reject) => {
          wrapper.on("error", reject);
          last.on("finish", resolve); // Needed by nodejs 12 and previous
          last.on("close", resolve);
        })
    );
  } else if (wrapper !== last && wrapper !== first) {
    last.on("finish", () => wrapper.emit("finish")); // Needed by nodejs 12 and previous
    last.on("close", () => wrapper.emit("close"));
  }

  if (last.readable) {
    decorateWithAsyncIterator(wrapper);
  }

  return wrapper;
}

module.exports = oleoduc;
