import transform from "parallel-transform";

export function transformData(handleChunk, options: any = {}) {
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
