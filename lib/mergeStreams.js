const { PassThrough } = require("stream");

function parseArgs(...args) {
  let last = args[args.length - 1];
  let hasOption = typeof last === "object" && !Array.isArray(last) && typeof last.pipe !== "function";
  let options = {
    objectMode: true,
    ...(hasOption ? args.pop() : {}),
  };

  return {
    streams: Array.isArray(args[0]) ? args[0] : args,
    options,
  };
}

function mergeStreams(...args) {
  let { streams, options } = parseArgs(...args);
  let cpt = streams.length;
  let passThrough = new PassThrough(options);
  passThrough.setMaxListeners(0);

  for (let stream of streams) {
    stream.pipe(passThrough, { end: false });
    stream.on("error", (e) => passThrough.emit("error", e));
    stream.once("end", () => --cpt === 0 && passThrough.end());
  }

  return passThrough;
}

module.exports = mergeStreams;
