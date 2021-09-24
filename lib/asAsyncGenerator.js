/**
 * Adapted from https://iximiuz.com/en/posts/nodejs-readable-streams-distilled/
 * @param readable
 * @param options
 * @returns {AsyncGenerator<*, void, *>}
 */
async function* asAsyncGenerator(readable, options = {}) {
  let chunkSize = options.chunkSize || 1;
  let ended = false;
  const onEnded = new Promise((res, rej) => {
    readable.once("error", rej);
    readable.once("end", () => {
      ended = true;
      res();
    });
  });

  while (!ended) {
    const chunk = readable.read(chunkSize);
    if (chunk !== null) {
      yield chunk;
      continue;
    }

    const onReadable = new Promise((res) => readable.once("readable", res));
    await Promise.race([onEnded, onReadable]);
  }
}

module.exports = asAsyncGenerator;
