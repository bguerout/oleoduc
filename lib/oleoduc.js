/**
 *  Adapted from https://www.npmjs.com/package/multipipe
 */
const duplexer = require("duplexer2");
const { PassThrough, Readable } = require("stream");

const decorateWithPromise = (stream, createPromise) => {
  const descriptors = ["then", "catch", "finally"].map((property) => {
    return [property, Reflect.getOwnPropertyDescriptor(Promise.prototype, property)];
  });

  for (const [property, descriptor] of descriptors) {
    const value = (...args) => Reflect.apply(descriptor.value, createPromise(), args);
    Reflect.defineProperty(stream, property, { ...descriptor, value });
  }
  return stream;
};

const getStreamOptions = (streams) => {
  let options;

  if (
    typeof streams[streams.length - 1] === "object" &&
    !Array.isArray(streams[streams.length - 1]) &&
    typeof streams[streams.length - 1].pipe !== "function"
  ) {
    options = streams.pop();
  }
  return Object.assign({}, { promisify: true, objectMode: true }, options || {});
};

module.exports = (...streams) => {
  let options = getStreamOptions(streams);

  if (Array.isArray(streams[0])) {
    streams = streams[0];
  }

  let first = streams[0];
  let last = streams[streams.length - 1];
  let ret;
  let wrapper = false;

  if (!first) {
    ret = first = last = new PassThrough(options);
    process.nextTick(() => ret.end());
  } else if (first.writable && last.readable) {
    ret = duplexer({ bubbleErrors: true, ...options }, first, last);
  } else if (streams.length === 1) {
    ret = new Readable(options).wrap(streams[0]);
  } else if (first.writable) {
    ret = first;
  } else if (last.readable) {
    ret = last;
  } else {
    ret = new PassThrough(options);
    wrapper = true;
  }

  for (const [i, stream] of streams.entries()) {
    const next = streams[i + 1];
    if (next) stream.pipe(next);
    if (stream !== ret) stream.on("error", (err) => ret.emit("error", err));
  }

  if (options.promisify) {
    return decorateWithPromise(
      ret,
      () =>
        new Promise((resolve, reject) => {
          ret.on("error", reject);
          last.on("finish", resolve);
          last.on("close", resolve);
        })
    );
  } else {
    if (wrapper) {
      last.on("finish", () => ret.emit("finish"));
      last.on("close", () => ret.emit("close"));
    }
    return ret;
  }
};
