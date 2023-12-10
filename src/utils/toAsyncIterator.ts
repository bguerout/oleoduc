import { Readable } from "stream";

type ToAsyncIteratorOptions = {
  chunkSize?: number;
};

/**
 * Adapted from
 *  - https://iximiuz.com/en/posts/nodejs-readable-streams-distilled/
 *  - https://www.derpturkey.com/nodejs-async-generators-for-streaming/
 * @param stream
 * @param options
 * @returns {AsyncGenerator<*, void, *>}
 */
export async function* toAsyncIterator(stream, options: ToAsyncIteratorOptions = {}) {
  const chunkSize = options.chunkSize || 1;

  if (typeof stream.read !== "function") {
    //FIXME seems not used
    stream = new Readable().wrap(stream);
  }

  let ended = false;
  const onEnded = new Promise<void>((res, rej) => {
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
