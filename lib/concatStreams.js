const { PassThrough } = require("stream");
const { parseArgs } = require("./utils/parseArgs");

class ArrayCursor {
  constructor(array) {
    this.array = array;
    this.cpt = 0;
  }

  next() {
    return this.array[this.cpt++];
  }
}

function isFunction(streams) {
  return streams.length === 1 && typeof streams[0] === "function";
}

function concatStreams(...args) {
  const { streams, options } = parseArgs(args);
  const cursor = isFunction(streams) ? { next: streams[0] } : new ArrayCursor(streams);
  const passThrough = new PassThrough({ objectMode: true, ...options });
  passThrough.setMaxListeners(0);

  async function concat() {
    const stream = await cursor.next();
    if (!stream) {
      return passThrough.end();
    }

    stream.on("error", (e) => passThrough.emit("error", e));
    stream.on("end", () => concat());
    stream.pipe(passThrough, { end: false });
  }

  concat();

  return passThrough;
}

module.exports = { concatStreams };
