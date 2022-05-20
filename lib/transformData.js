const transform = require("parallel-transform");

function transformData(handleChunk, options = {}) {
  const { filter, parallel, ...rest } = options;
  const filterChunk = (value) => !filter || filter(value);
  const maxParallel = parallel || 1;

  return transform(maxParallel, { objectMode: true, ...rest }, async (chunk, callback) => {
    try {
      if (!(await filterChunk(chunk))) {
        return callback(null, null);
      }
      const res = await handleChunk(chunk);
      callback(null, res);
    } catch (e) {
      callback(e);
    }
  });
}

module.exports = transformData;
