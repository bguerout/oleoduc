const { Transform } = require("stream");

module.exports = (reduce, options = {}) => {
  let accumulator = options.initialValue === undefined ? null : options.initialValue;

  return new Transform({
    objectMode: true,
    transform: async function (chunk, encoding, callback) {
      try {
        accumulator = await reduce(accumulator, chunk);
        callback();
      } catch (e) {
        callback(e);
      }
    },
    flush(callback) {
      this.push(accumulator);
      callback();
    },
  });
};
