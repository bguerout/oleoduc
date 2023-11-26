import { Transform, TransformOptions } from "stream";

type AccumulateDateOptions = {
  accumulator?: unknown;
} & TransformOptions;

export function accumulateData(accumulate, options: AccumulateDateOptions = {}) {
  const { accumulator, ...rest } = options;
  let acc = accumulator === undefined ? null : accumulator;
  let flushed = false;

  return new Transform({
    objectMode: true,
    ...rest,
    transform: async function (chunk, encoding, callback) {
      try {
        flushed = false;
        const flush = (res) => {
          flushed = true;
          this.push(res);
        };

        acc = await accumulate(acc, chunk, flush);

        callback();
      } catch (e) {
        callback(e);
      }
    },
    flush(callback) {
      if (!flushed) {
        this.push(acc);
      }
      callback();
    },
  });
}
