const { Transform } = require("stream");

module.exports = (accumulate, options = {}) => {
  const reset = () => (options.accumulator === undefined ? null : options.accumulator);
  let acc = reset();
  let flushed = false;

  return new Transform({
    objectMode: true,
    transform: async function (chunk, encoding, callback) {
      try {
        flushed = false;
        let flush = (res) => {
          flushed = true;
          this.push(res);
        };

        let res = await accumulate(acc, chunk, flush);
        acc = flushed ? reset() : res;

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
};
