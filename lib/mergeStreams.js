const { PassThrough } = require("stream");
const decorateWithAsyncIterator = require("./utils/decorateWithAsyncIterator");
const parseArgs = require("./utils/parseArgs");

function mergeStreams(...args) {
  let { streams, options } = parseArgs(args);
  let cpt = 0;
  let last = streams[streams.length - 1];
  let passThrough = new PassThrough(options);
  passThrough.setMaxListeners(0);

  async function pipeStream(obj) {
    let stream = typeof obj === "function" ? await obj() : obj;
    stream.on("error", (e) => passThrough.emit("error", e));
    stream.once("end", () => {
      if (++cpt === streams.length) {
        passThrough.end();
      } else if (options.sequential) {
        //lazy
        pipeStream(streams[cpt]);
      }
    });

    stream.pipe(passThrough, { end: false });
  }

  options.sequential ? pipeStream(streams[0]) : streams.forEach((s) => pipeStream(s));

  if (last.readable) {
    decorateWithAsyncIterator(passThrough);
  }

  return passThrough;
}

module.exports = mergeStreams;
