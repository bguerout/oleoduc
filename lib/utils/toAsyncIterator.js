const { Readable } = require("stream");

/**
 * Adapted from
 *  - https://iximiuz.com/en/posts/nodejs-readable-streams-distilled/
 *  - https://www.derpturkey.com/nodejs-async-generators-for-streaming/
 * @param stream
 * @param options
 * @returns {AsyncGenerator<*, void, *>}
 */
async function* toAsyncIterator(stream, options = {}) {
  let chunkSize = options.chunkSize || 1;
  let ended = false;
  if (typeof stream.read !== "function") {
    stream = Readable.wrap(stream, { objectMode: true });
  }

  const onEnded = new Promise((res, rej) => {
    stream.once("error", rej);
    stream.once("end", () => {
      ended = true;
      res();
    });
  });

  while (!ended) {
    const chunk = stream.read(chunkSize);
    if (chunk !== null) {
      yield chunk;
      continue;
    }

    const onReadable = new Promise((res) => stream.once("readable", res));
    await Promise.race([onEnded, onReadable]);
  }
}

module.exports = toAsyncIterator;
