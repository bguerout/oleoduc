/**
 *  Adapted from https://www.npmjs.com/package/stream-combiner
 */
var duplexer = require("duplexer");
var through = require("through");

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

function pipeStreamsTogether(streams) {
  if (streams.length < 2) return;
  streams[0].pipe(streams[1]);
  pipeStreamsTogether(streams.slice(1));
}

function hasOptions(streams) {
  return (
    typeof streams[streams.length - 1] === "object" &&
    !Array.isArray(streams[streams.length - 1]) &&
    typeof streams[streams.length - 1].pipe !== "function"
  );
}

function ensureEventsArePropagated(streams, duplexStream) {
  //es.duplex already reemits the error from the first and last stream.
  //add a listener for the inner streams in the pipeline.
  for (var i = 1; i < streams.length - 1; i++) {
    streams[i].on("error", () => {
      var args = [].slice.call(arguments);
      args.unshift("error");
      duplexStream.emit.apply(duplexStream, args);
    });
  }

  let last = streams[streams.length - 1];
  last.on("finish", () => duplexStream.emit("finish"));
  last.on("close", () => duplexStream.emit("close"));
}

module.exports = function (...args) {
  let options = { promisify: true };
  if (hasOptions(args)) {
    options = args.pop();
  }

  let streams = args;
  if (streams.length === 0) {
    return through();
  } else if (streams.length === 1) {
    return streams[0];
  }

  let first = streams[0];
  let last = streams[streams.length - 1];
  let duplexStream = duplexer(first, last);

  pipeStreamsTogether(streams);
  ensureEventsArePropagated(streams, duplexStream);

  if (options.promisify) {
    decorateWithPromise(
      duplexStream,
      () =>
        new Promise((resolve, reject) => {
          duplexStream.on("error", reject);
          last.on("finish", resolve);
          last.on("close", resolve);
        })
    );
  }
  return duplexStream;
};
