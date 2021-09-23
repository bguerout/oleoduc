/**
 *  Adapted from https://www.npmjs.com/package/multipipe
 */
const duplexer = require("duplexer3");
const { PassThrough } = require("stream");

function decorateWithPromise(stream, createPromise) {
  const descriptors = ["then", "catch", "finally"].map((property) => {
    return [property, Reflect.getOwnPropertyDescriptor(Promise.prototype, property)];
  });

  for (const [property, descriptor] of descriptors) {
    const value = (...args) => Reflect.apply(descriptor.value, createPromise(), args);
    Reflect.defineProperty(stream, property, { ...descriptor, value });
  }
  return stream;
}

function parseArgs(...args) {
  let last = args[args.length - 1];
  let hasOption = typeof last === "object" && !Array.isArray(last) && typeof last.pipe !== "function";
  let options = {
    promisify: true,
    objectMode: true,
    ...(hasOption ? args.pop() : {}),
  };

  return {
    streams: Array.isArray(args[0]) ? args[0] : args,
    options,
  };
}

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

module.exports = function (...args) {
  let { streams, options } = parseArgs(...args);

  if (streams.length === 0) {
    throw new Error("You must provide at least one stream");
  }

  let first = streams[0];
  let last = streams[streams.length - 1];
  let wrapper;

  if (streams.length === 1) {
    wrapper = streams[0];
  } else if (first.writable && last.readable) {
    wrapper = duplexer(options, first, last);
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

  return wrapper;
};
