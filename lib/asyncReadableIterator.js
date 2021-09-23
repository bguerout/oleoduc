async function isEnded(reader) {
  return new Promise((resolve) => reader.once("end", resolve));
}

async function isReadable(reader) {
  return new Promise((resolve) => reader.once("readable", resolve));
}

/**
 * Adapted from https://www.derpturkey.com/nodejs-async-generators-for-streaming/
 * @param reader
 * @param options
 * @returns {AsyncGenerator<*, void, *>}
 */
async function* asyncReadableIterator(reader, options = {}) {
  let chunkSize = options.chunkSize || 1;
  let error;
  reader.on("error", (e) => {
    error = e;
  });

  while (!reader.readableEnded) {
    while (reader.readable) {
      let val = reader.read(chunkSize) || reader.read();

      if (error) {
        throw error;
      } else if (!val) {
        break;
      } else {
        yield val;
      }
    }

    //Wait for reader to be readable again or to be ended.
    await Promise.race([isEnded(reader), isReadable(reader)]);
  }
}

module.exports = asyncReadableIterator;
