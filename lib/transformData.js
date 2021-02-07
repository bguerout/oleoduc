const transform = require("parallel-transform");

module.exports = (handleChunk, options = {}) => {
  let { filter, parallel, ...rest } = options;
  let filterChunk = (value) => !filter || filter(value);
  let maxParallel = parallel || 1;

  return transform(maxParallel, { objectMode: true, ...rest }, async (chunk, callback) => {
    try {
      if (!filterChunk(chunk)) {
        return callback(null, null);
      }
      let res = await handleChunk(chunk);
      callback(null, res);
    } catch (e) {
      callback(e);
    }
  });
};
