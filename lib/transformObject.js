const transform = require("parallel-transform");

module.exports = (handleChunk, options = {}) => {
  let mustBeHandled = (value) => !options.filter || options.filter(value);

  return transform(options.parallel || 1, { objectMode: true }, async (chunk, callback) => {
    try {
      if (!mustBeHandled(chunk)) {
        return callback(null, null);
      }
      let res = await handleChunk(chunk);
      callback(null, res);
    } catch (e) {
      callback(e);
    }
  });
};
